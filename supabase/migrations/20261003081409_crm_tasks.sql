-- ─────────────────────────────────────────────────────────────────────────────
-- CRM — vraies tâches (échéance, priorité, rappel) — remplace lead_activities
-- de type 'task'. À exécuter une seule fois (idempotent).
--
-- Les types de profile_id / lead_id sont lus depuis link_profiles.id et
-- leads.id pour rester compatibles avec ton schéma réel (uuid ou bigint).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  pt text;
  lt text;
BEGIN
  SELECT format_type(atttypid, atttypmod) INTO pt
    FROM pg_attribute
   WHERE attrelid = 'public.link_profiles'::regclass AND attname = 'id';

  SELECT format_type(atttypid, atttypmod) INTO lt
    FROM pg_attribute
   WHERE attrelid = 'public.leads'::regclass AND attname = 'id';

  EXECUTE format($f$
    CREATE TABLE IF NOT EXISTS public.crm_tasks (
      id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id         %s NOT NULL REFERENCES public.link_profiles(id) ON DELETE CASCADE,
      lead_id            %s REFERENCES public.leads(id) ON DELETE CASCADE,
      title              text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
      description        text,
      due_at             timestamptz,
      priority           text NOT NULL DEFAULT 'normal'
                           CHECK (priority IN ('low', 'normal', 'high')),
      status             text NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'done', 'cancelled')),
      completed_at       timestamptz,
      source             text NOT NULL DEFAULT 'manual'
                           CHECK (source IN ('manual', 'automation', 'system')),
      assigned_to        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      reminder_sent_at   timestamptz,
      legacy_activity_id text,
      created_at         timestamptz NOT NULL DEFAULT now(),
      updated_at         timestamptz NOT NULL DEFAULT now()
    )
  $f$, pt, lt);
END $$;

CREATE INDEX IF NOT EXISTS crm_tasks_profile_status_due_idx
  ON public.crm_tasks (profile_id, status, due_at);
CREATE INDEX IF NOT EXISTS crm_tasks_lead_idx
  ON public.crm_tasks (lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_tasks_reminder_idx
  ON public.crm_tasks (due_at) WHERE status = 'open' AND reminder_sent_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS crm_tasks_legacy_activity_uidx
  ON public.crm_tasks (legacy_activity_id) WHERE legacy_activity_id IS NOT NULL;

-- updated_at automatique
CREATE OR REPLACE FUNCTION public.crm_tasks_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  -- Si l'échéance change, le rappel doit pouvoir repartir
  IF NEW.due_at IS DISTINCT FROM OLD.due_at THEN
    NEW.reminder_sent_at := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS crm_tasks_touch_trg ON public.crm_tasks;
CREATE TRIGGER crm_tasks_touch_trg
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.crm_tasks_touch();

-- ─── RLS : le propriétaire du profil uniquement ──────────────────────────────
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_tasks_owner_all ON public.crm_tasks;
CREATE POLICY crm_tasks_owner_all ON public.crm_tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.link_profiles p
             WHERE p.id = crm_tasks.profile_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.link_profiles p
             WHERE p.id = crm_tasks.profile_id AND p.user_id = auth.uid())
    -- le lead doit appartenir au même profil (anti fuite inter-comptes)
    AND (
      lead_id IS NULL OR EXISTS (
        SELECT 1 FROM public.leads l
         WHERE l.id = crm_tasks.lead_id AND l.profile_id = crm_tasks.profile_id)
    )
  );

REVOKE ALL ON public.crm_tasks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;

-- ─── lead_activities.type : autoriser 'task_created' (timeline du lead) ──────
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
     WHERE conrelid = 'public.lead_activities'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%task_done%'
  LOOP
    EXECUTE format('ALTER TABLE public.lead_activities DROP CONSTRAINT %I', c.conname);
  END LOOP;

  ALTER TABLE public.lead_activities
    ADD CONSTRAINT lead_activities_type_check
    CHECK (type = ANY (ARRAY['created','status','note','whatsapp','edited',
                             'task','task_done','task_created']));
END $$;

-- ─── Reprise des anciennes tâches (lead_activities.type = 'task') ────────────
INSERT INTO public.crm_tasks
  (profile_id, lead_id, title, status, completed_at, source, created_at, legacy_activity_id)
SELECT l.profile_id,
       a.lead_id,
       left(coalesce(nullif(btrim(a.description), ''), 'Tâche'), 200),
       CASE WHEN a.done_at IS NOT NULL THEN 'done' ELSE 'open' END,
       a.done_at,
       'automation',
       a.created_at,
       a.id::text
  FROM public.lead_activities a
  JOIN public.leads l ON l.id = a.lead_id
 WHERE a.type = 'task'
ON CONFLICT DO NOTHING;

-- ─── Rappels : notification dans la cloche quand une tâche arrive à échéance ─
CREATE OR REPLACE FUNCTION public.crm_send_task_reminders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n integer;
BEGIN
  WITH due AS (
    UPDATE public.crm_tasks t
       SET reminder_sent_at = now()
     WHERE t.status = 'open'
       AND t.due_at IS NOT NULL
       AND t.due_at <= now()
       AND t.reminder_sent_at IS NULL
    RETURNING t.title, t.profile_id, t.lead_id
  ), ins AS (
    INSERT INTO public.notifications (user_id, type, title, message, is_read)
    SELECT p.user_id,
           'info',
           '⏰ Tâche à faire',
           d.title || coalesce(' — ' || l.name, ''),
           false
      FROM due d
      JOIN public.link_profiles p ON p.id = d.profile_id
      LEFT JOIN public.leads l ON l.id = d.lead_id
    RETURNING 1
  )
  SELECT count(*) INTO n FROM ins;
  RETURN n;
END $$;

REVOKE EXECUTE ON FUNCTION public.crm_send_task_reminders() FROM PUBLIC, anon, authenticated;

-- Planification toutes les 15 minutes (uniquement si pg_cron est activé)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'crm-task-reminders',
      '*/15 * * * *',
      'SELECT public.crm_send_task_reminders()'
    );
  ELSE
    RAISE NOTICE 'pg_cron non activé : active-le (Database → Extensions) puis relance ce bloc.';
  END IF;
END $$;
