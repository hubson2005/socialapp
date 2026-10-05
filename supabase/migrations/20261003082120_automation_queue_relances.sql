-- ─────────────────────────────────────────────────────────────────────────────
-- Relances automatiques avec délai ('wait') + réparation du moteur SQL.
-- DÉJÀ APPLIQUÉE sur le projet gxguirtpunmiiuxpxlap (03/10/2026) — ce fichier
-- sert à versionner le schéma dans le repo. Rejouable (CREATE OR REPLACE / IF NOT EXISTS).
-- Retour arrière : 20261003010000_automation_queue_relances.rollback.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- File d'attente des actions différées
CREATE TABLE IF NOT EXISTS public.automation_queue (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id     uuid   NOT NULL REFERENCES public.automations(id)   ON DELETE CASCADE,
  profile_id        bigint NOT NULL REFERENCES public.link_profiles(id) ON DELETE CASCADE,
  lead_id           uuid   NOT NULL REFERENCES public.leads(id)         ON DELETE CASCADE,
  run_at            timestamptz NOT NULL,
  remaining_actions jsonb  NOT NULL,
  cancel_if         text   NOT NULL DEFAULT 'none'
                      CHECK (cancel_if IN ('none','status_changed','lead_replied','any_activity')),
  baseline          jsonb  NOT NULL DEFAULT '{}'::jsonb,
  status            text   NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','running','done','cancelled','error')),
  last_error        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  processed_at      timestamptz
);
CREATE INDEX IF NOT EXISTS automation_queue_due_idx
  ON public.automation_queue (run_at) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS automation_queue_one_pending_uidx
  ON public.automation_queue (automation_id, lead_id) WHERE status = 'pending';

ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS automation_queue_owner_select ON public.automation_queue;
CREATE POLICY automation_queue_owner_select ON public.automation_queue
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.link_profiles p
                  WHERE p.id = automation_queue.profile_id AND p.user_id = auth.uid()));
REVOKE ALL ON public.automation_queue FROM anon, authenticated;
GRANT SELECT ON public.automation_queue TO authenticated;

-- Photo de l'état d'un lead (pour annuler une relance devenue inutile)
CREATE OR REPLACE FUNCTION public.automation_baseline(p_lead_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'status', l.status,
    'last_activity_at', (SELECT max(a.created_at) FROM lead_activities a
                          WHERE a.lead_id = l.id AND a.type NOT IN ('task','task_created')),
    'last_inbound_at',  (SELECT max(w.last_inbound_at) FROM whatsapp_contacts w
                          WHERE w.profile_id = l.profile_id
                            AND w.phone_norm IS NOT NULL AND w.phone_norm = l.phone_norm)
  )
  FROM leads l WHERE l.id = p_lead_id
$$;

CREATE OR REPLACE FUNCTION public.automation_cancel_reason(p_lead_id uuid, p_cancel_if text, p_baseline jsonb)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE cur jsonb := automation_baseline(p_lead_id);
BEGIN
  IF cur IS NULL THEN RETURN 'contact supprimé'; END IF;
  IF p_cancel_if = 'status_changed'
     AND (cur->>'status') IS DISTINCT FROM (p_baseline->>'status') THEN
    RETURN 'statut modifié';
  END IF;
  IF p_cancel_if = 'lead_replied'
     AND (cur->>'last_inbound_at')::timestamptz
         > COALESCE((p_baseline->>'last_inbound_at')::timestamptz, '-infinity'::timestamptz) THEN
    RETURN 'le contact a répondu';
  END IF;
  IF p_cancel_if = 'any_activity'
     AND (cur->>'last_activity_at')::timestamptz
         > COALESCE((p_baseline->>'last_activity_at')::timestamptz, '-infinity'::timestamptz) THEN
    RETURN 'activité détectée';
  END IF;
  RETURN NULL;
END $$;

-- Création d'une vraie tâche CRM (sans doublon ouvert)
CREATE OR REPLACE FUNCTION public.automation_insert_task(
  p_profile_id bigint, p_lead_id uuid, p_title text, p_description text, p_hours numeric, p_priority text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM crm_tasks WHERE lead_id = p_lead_id AND status = 'open' AND title = p_title) THEN
    RETURN false;
  END IF;
  INSERT INTO crm_tasks (profile_id, lead_id, title, description, due_at, priority, source)
  VALUES (p_profile_id, p_lead_id, p_title, p_description,
          CASE WHEN COALESCE(p_hours, 0) > 0
               THEN now() + make_interval(secs => LEAST(p_hours, 8760)::float8 * 3600) END,
          CASE WHEN p_priority IN ('low','normal','high') THEN p_priority ELSE 'normal' END,
          'automation');
  INSERT INTO lead_activities (lead_id, type, description) VALUES (p_lead_id, 'task_created', p_title);
  RETURN true;
END $$;

-- Moteur SQL : create_task -> crm_tasks, notify_owner réparé, send_whatsapp -> tâche prête à envoyer
CREATE OR REPLACE FUNCTION public.automation_execute_action(
  p_action text, p_config jsonb, p_lead_id uuid DEFAULT NULL::uuid,
  p_profile_id bigint DEFAULT NULL::bigint, p_owner_user_id uuid DEFAULT NULL::uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result jsonb := '{"ok": true}'::jsonb;
  v_tags text[]; v_tag text; v_score integer; v_new_score integer;
  v_title text; v_hours numeric; v_owner uuid; v_name text; v_msg text; v_created boolean;
BEGIN
  IF p_lead_id IS NOT NULL AND p_profile_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM leads WHERE id = p_lead_id AND profile_id = p_profile_id) THEN
    RETURN jsonb_build_object('ok', false, 'action', p_action, 'error', 'lead_hors_profil');
  END IF;

  CASE p_action

    WHEN 'create_task' THEN
      IF p_lead_id IS NULL OR p_profile_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'action', p_action, 'error', 'lead_requis');
      END IF;
      v_title := left(btrim(COALESCE(p_config->>'taskTitle', p_config->>'task',
                                     p_config->>'taskDescription', 'Tâche automatique')), 200);
      v_hours := COALESCE(NULLIF(p_config->>'dueInHours','')::numeric,
                          NULLIF(p_config->>'dueInDays','')::numeric * 24, 0);
      v_created := automation_insert_task(p_profile_id, p_lead_id, v_title, NULL, v_hours, p_config->>'priority');
      v_result := jsonb_build_object('ok', true, 'action', 'create_task', 'created', v_created);

    WHEN 'send_whatsapp' THEN
      IF p_lead_id IS NULL OR p_profile_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'action', p_action, 'error', 'lead_requis');
      END IF;
      IF EXISTS (SELECT 1 FROM leads l JOIN whatsapp_contacts w
                   ON w.profile_id = l.profile_id AND w.phone_norm = l.phone_norm
                  WHERE l.id = p_lead_id AND w.opted_out IS TRUE) THEN
        RETURN jsonb_build_object('ok', true, 'action', p_action, 'skipped', 'opted_out');
      END IF;
      v_msg := COALESCE(NULLIF(btrim(p_config->>'message'), ''), 'Bonjour ! Je reviens vers vous. 👋');
      v_created := automation_insert_task(p_profile_id, p_lead_id,
                     'Envoyer sur WhatsApp : ' || left(v_msg, 120), v_msg, 0.001, 'high');
      v_result := jsonb_build_object('ok', true, 'action', 'send_whatsapp', 'created', v_created);

    WHEN 'add_score' THEN
      IF p_lead_id IS NOT NULL THEN
        SELECT score INTO v_score FROM leads WHERE id = p_lead_id;
        v_new_score := GREATEST(0, LEAST(100,
          COALESCE(v_score,50) + COALESCE((p_config->>'score')::int,(p_config->>'amount')::int,0)));
        UPDATE leads SET score = v_new_score, updated_at = now() WHERE id = p_lead_id;
        v_result := jsonb_build_object('ok',true,'action','add_score','new_score',v_new_score);
      END IF;

    WHEN 'add_tag' THEN
      IF p_lead_id IS NOT NULL AND p_config->>'tag' IS NOT NULL THEN
        v_tag := trim(p_config->>'tag');
        SELECT tags INTO v_tags FROM leads WHERE id = p_lead_id;
        IF NOT (v_tag = ANY(COALESCE(v_tags,'{}'::text[]))) THEN
          UPDATE leads SET tags = array_append(COALESCE(tags,'{}'::text[]), v_tag), updated_at = now() WHERE id = p_lead_id;
        END IF;
        v_result := jsonb_build_object('ok',true,'action','add_tag','tag',v_tag);
      END IF;

    WHEN 'notify_owner' THEN
      v_owner := COALESCE(p_owner_user_id, (SELECT user_id FROM link_profiles WHERE id = p_profile_id));
      IF v_owner IS NOT NULL THEN
        SELECT name INTO v_name FROM leads WHERE id = p_lead_id;
        INSERT INTO notifications (user_id, type, title, message, is_read)
        VALUES (v_owner, 'info',
          COALESCE(p_config->>'notifTitle', p_config->>'title', 'Automatisation planifiée'),
          COALESCE(p_config->>'message', 'Une automatisation planifiée a été exécutée.')
            || COALESCE(' — ' || v_name, ''),
          false);
        v_result := jsonb_build_object('ok',true,'action','notify_owner');
      END IF;

    ELSE
      v_result := jsonb_build_object('ok',false,'action',p_action,'reason','non_supportee_sql');
  END CASE;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok',false,'error',SQLERRM);
END;
$function$;

-- Exécute une liste d'actions ; sur 'wait' met la suite en file d'attente
CREATE OR REPLACE FUNCTION public.automation_run_actions(
  p_automation_id uuid, p_actions jsonb, p_lead_id uuid, p_profile_id bigint, p_owner_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  r record; v_type text; v_cfg jsonb; v_res jsonb; v_hours numeric;
  v_cancel text; v_rest jsonb; v_rows int := 0; v_n int := 0;
BEGIN
  FOR r IN SELECT value AS el, ordinality AS idx
             FROM jsonb_array_elements(COALESCE(p_actions, '[]'::jsonb)) WITH ORDINALITY
  LOOP
    IF jsonb_typeof(r.el) = 'string' THEN
      v_type := r.el #>> '{}'; v_cfg := '{}'::jsonb;
    ELSE
      v_type := r.el->>'type'; v_cfg := COALESCE(r.el->'config', '{}'::jsonb);
    END IF;

    IF v_type = 'wait' THEN
      IF p_lead_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'executed', v_n, 'error', 'wait_requiert_un_lead');
      END IF;
      v_hours := COALESCE(NULLIF(v_cfg->>'delayHours','')::numeric,
                          NULLIF(v_cfg->>'delayDays','')::numeric * 24, 24);
      v_hours := LEAST(GREATEST(v_hours, 0.05), 720);
      v_cancel := COALESCE(NULLIF(v_cfg->>'cancelIf',''), 'none');
      IF v_cancel NOT IN ('none','status_changed','lead_replied','any_activity') THEN v_cancel := 'none'; END IF;
      SELECT COALESCE(jsonb_agg(x.value ORDER BY x.ordinality), '[]'::jsonb) INTO v_rest
        FROM jsonb_array_elements(p_actions) WITH ORDINALITY x WHERE x.ordinality > r.idx;
      IF jsonb_array_length(v_rest) > 0 THEN
        INSERT INTO automation_queue (automation_id, profile_id, lead_id, run_at, remaining_actions, cancel_if, baseline)
        VALUES (p_automation_id, p_profile_id, p_lead_id,
                now() + make_interval(secs => v_hours::float8 * 3600),
                v_rest, v_cancel, COALESCE(automation_baseline(p_lead_id), '{}'::jsonb))
        ON CONFLICT (automation_id, lead_id) WHERE status = 'pending' DO NOTHING;
        GET DIAGNOSTICS v_rows = ROW_COUNT;
      END IF;
      RETURN jsonb_build_object('ok', true, 'executed', v_n, 'queued', v_rows > 0);
    END IF;

    v_res := automation_execute_action(v_type, v_cfg, p_lead_id, p_profile_id, p_owner_user_id);
    IF COALESCE((v_res->>'ok')::boolean, false) IS NOT TRUE THEN
      RETURN jsonb_build_object('ok', false, 'executed', v_n,
               'error', COALESCE(v_res->>'error', v_res->>'reason', 'echec_' || v_type));
    END IF;
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'executed', v_n, 'queued', false);
END $$;

-- Exécution des relances arrivées à échéance (appelée par pg_cron)
CREATE OR REPLACE FUNCTION public.process_automation_queue()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  r record; v_auto record; v_reason text; v_res jsonb; v_ok boolean; v_err text; v_count int := 0;
BEGIN
  FOR r IN
    SELECT q.* FROM automation_queue q
     WHERE q.status = 'pending' AND q.run_at <= now()
     ORDER BY q.run_at LIMIT 100
     FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE automation_queue SET status = 'running' WHERE id = r.id;

    SELECT a.name, a.active, lp.user_id INTO v_auto
      FROM automations a JOIN link_profiles lp ON lp.id = a.profile_id
     WHERE a.id = r.automation_id;

    v_reason := CASE WHEN NOT FOUND OR v_auto.active IS NOT TRUE THEN 'automatisation désactivée'
                     ELSE automation_cancel_reason(r.lead_id, r.cancel_if, r.baseline) END;

    IF v_reason IS NOT NULL THEN
      UPDATE automation_queue SET status = 'cancelled', last_error = v_reason, processed_at = now() WHERE id = r.id;
      INSERT INTO automation_logs (automation_id, profile_id, automation_name, trigger_label, status, error_message, entity_id)
      VALUES (r.automation_id, r.profile_id, v_auto.name, '⏳ Relance annulée (' || v_reason || ')', 'ok', NULL, r.lead_id::text);
    ELSE
      BEGIN
        v_res := automation_run_actions(r.automation_id, r.remaining_actions, r.lead_id, r.profile_id, v_auto.user_id);
        v_ok  := COALESCE((v_res->>'ok')::boolean, false);
        v_err := v_res->>'error';
      EXCEPTION WHEN OTHERS THEN
        v_ok := false; v_err := SQLERRM;
      END;
      UPDATE automation_queue
         SET status = CASE WHEN v_ok THEN 'done' ELSE 'error' END, last_error = v_err, processed_at = now()
       WHERE id = r.id;
      INSERT INTO automation_logs (automation_id, profile_id, automation_name, trigger_label, status, error_message, entity_id)
      VALUES (r.automation_id, r.profile_id, v_auto.name, '⏳ Relance planifiée',
              CASE WHEN v_ok THEN 'ok' ELSE 'error' END, v_err, r.lead_id::text);
    END IF;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

-- RPC pour les moteurs navigateur / Edge Function : met en file la suite à partir de l'index de 'wait'
CREATE OR REPLACE FUNCTION public.automation_enqueue_from(p_automation_id uuid, p_lead_id uuid, p_from_index integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE a record; v_actions jsonb; v_owner uuid;
BEGIN
  SELECT * INTO a FROM automations WHERE id = p_automation_id AND active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'automatisation_introuvable'); END IF;
  IF NOT EXISTS (SELECT 1 FROM leads WHERE id = p_lead_id AND profile_id = a.profile_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'lead_invalide');
  END IF;
  IF (SELECT count(*) FROM automation_queue WHERE profile_id = a.profile_id AND status = 'pending') >= 500 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'file_saturee');
  END IF;
  SELECT jsonb_agg(jsonb_build_object('type', s.action_type, 'config', s.action_config) ORDER BY s.rn)
    INTO v_actions
    FROM (SELECT row_number() OVER () AS rn, action_type, action_config
            FROM automation_resolve_actions(to_jsonb(a))) s
   WHERE s.rn > GREATEST(p_from_index, 0);
  SELECT user_id INTO v_owner FROM link_profiles WHERE id = a.profile_id;
  RETURN automation_run_actions(a.id, v_actions, p_lead_id, a.profile_id, v_owner);
END $$;

-- Relance des leads inactifs : passe par le nouveau moteur (wait, tâches CRM, notifications)
CREATE OR REPLACE FUNCTION public.process_lead_inactif()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r_auto record; r_lead record; v_days integer; v_actions jsonb; v_res jsonb; v_ok boolean; v_err text;
BEGIN
  FOR r_auto IN
    SELECT a.*, lp.user_id AS owner_user_id
      FROM automations a JOIN link_profiles lp ON lp.id = a.profile_id
     WHERE a.trigger = 'lead_inactif' AND a.active = true
  LOOP
    v_days := GREATEST(COALESCE(NULLIF(r_auto.action_config->>'inactivity_days','')::int, 3), 1);
    SELECT jsonb_agg(jsonb_build_object('type', s.action_type, 'config', s.action_config) ORDER BY s.rn)
      INTO v_actions
      FROM (SELECT row_number() OVER () AS rn, action_type, action_config
              FROM automation_resolve_actions(to_jsonb(r_auto))) s;
    CONTINUE WHEN v_actions IS NULL;

    FOR r_lead IN
      SELECT l.id, l.profile_id FROM leads l
       WHERE l.profile_id = r_auto.profile_id
         AND l.status NOT IN ('client', 'perdu')
         AND l.created_at < now() - make_interval(days => v_days)
         AND NOT EXISTS (SELECT 1 FROM lead_activities la
                          WHERE la.lead_id = l.id AND la.created_at > now() - make_interval(days => v_days))
         AND NOT EXISTS (SELECT 1 FROM automation_logs al
                          WHERE al.automation_id = r_auto.id AND al.entity_id = l.id::text
                            AND al.created_at > now() - GREATEST(interval '23 hours', make_interval(days => v_days)))
    LOOP
      BEGIN
        v_res := automation_run_actions(r_auto.id, v_actions, r_lead.id, r_lead.profile_id, r_auto.owner_user_id);
        v_ok  := COALESCE((v_res->>'ok')::boolean, false);
        v_err := v_res->>'error';
      EXCEPTION WHEN OTHERS THEN
        v_ok := false; v_err := SQLERRM;
      END;
      IF v_ok THEN
        UPDATE automations SET runs = COALESCE(runs,0) + 1, last_run = now() WHERE id = r_auto.id;
      END IF;
      INSERT INTO automation_logs (automation_id, profile_id, automation_name, trigger_label, status, error_message, entity_id)
      VALUES (r_auto.id, r_auto.profile_id, r_auto.name, '😴 Lead inactif',
              CASE WHEN v_ok THEN 'ok' ELSE 'error' END, v_err, r_lead.id::text);
    END LOOP;
  END LOOP;
END;
$function$;

-- Droits : fonctions internes réservées au serveur, RPC publique limitée
REVOKE ALL ON FUNCTION public.automation_baseline(uuid)                                       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.automation_cancel_reason(uuid, text, jsonb)                     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.automation_insert_task(bigint, uuid, text, text, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.automation_run_actions(uuid, jsonb, uuid, bigint, uuid)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_automation_queue()                                      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.automation_enqueue_from(uuid, uuid, integer)                    FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.automation_enqueue_from(uuid, uuid, integer) TO anon, authenticated, service_role;

-- Cron : toutes les 5 minutes
SELECT cron.schedule('process-automation-queue', '*/5 * * * *', 'SELECT public.process_automation_queue()');
