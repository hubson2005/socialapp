-- Retour arrière de 20261003010000_automation_queue_relances.sql
-- Restaure les définitions d'origine (relevées sur la base avant migration).
-- ⚠ Supprime la file d'attente : les relances encore en attente sont perdues.

SELECT cron.unschedule('process-automation-queue');

DROP FUNCTION IF EXISTS public.process_automation_queue();
DROP FUNCTION IF EXISTS public.automation_enqueue_from(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.automation_run_actions(uuid, jsonb, uuid, bigint, uuid);
DROP FUNCTION IF EXISTS public.automation_cancel_reason(uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.automation_baseline(uuid);
DROP FUNCTION IF EXISTS public.automation_insert_task(bigint, uuid, text, text, numeric, text);
DROP TABLE IF EXISTS public.automation_queue;

CREATE OR REPLACE FUNCTION public.automation_execute_action(p_action text, p_config jsonb, p_lead_id uuid DEFAULT NULL::uuid, p_profile_id bigint DEFAULT NULL::bigint, p_owner_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result    JSONB := '{"ok": true}'::jsonb;
  v_tags      TEXT[];
  v_tag       TEXT;
  v_score     INTEGER;
  v_new_score INTEGER;
BEGIN
  CASE p_action

    WHEN 'create_task' THEN
      IF p_lead_id IS NOT NULL THEN
        INSERT INTO lead_activities (lead_id, type, description)
        VALUES (p_lead_id, 'task',
          COALESCE(p_config->>'taskTitle', p_config->>'task', 'Tâche automatique'));
        v_result := jsonb_build_object('ok',true,'action','create_task');
      END IF;

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
      IF p_owner_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, profile_id, type, title, message, read)
        VALUES (p_owner_user_id, p_profile_id, 'automation',
          COALESCE(p_config->>'notifTitle', p_config->>'title', 'Automatisation planifiée'),
          COALESCE(p_config->>'message', 'Une automatisation planifiée a été exécutée.'), false)
        ON CONFLICT DO NOTHING;
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

CREATE OR REPLACE FUNCTION public.process_lead_inactif()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r_auto       RECORD;
  r_lead       RECORD;
  v_days       INTEGER;
  r_action     RECORD;
  v_owner_id   UUID;
  v_ok         BOOLEAN := true;
  v_err        TEXT    := NULL;
BEGIN
  FOR r_auto IN
    SELECT a.*, lp.user_id AS owner_user_id
    FROM   automations a
    JOIN   link_profiles lp ON lp.id = a.profile_id
    WHERE  a.trigger = 'lead_inactif' AND a.active = true
  LOOP
    v_days     := COALESCE((r_auto.action_config->>'inactivity_days')::int, 3);
    v_owner_id := r_auto.owner_user_id;

    FOR r_lead IN
      SELECT l.id, l.name, l.profile_id
      FROM   leads l
      WHERE  l.profile_id = r_auto.profile_id
        AND  l.status NOT IN ('client', 'perdu')
        AND  NOT EXISTS (
               SELECT 1 FROM lead_activities la
               WHERE la.lead_id = l.id
                 AND la.created_at > now() - (v_days || ' days')::interval
             )
        AND  l.created_at < now() - (v_days || ' days')::interval
        AND  NOT EXISTS (
               SELECT 1 FROM automation_logs al
               WHERE al.automation_id = r_auto.id
                 AND al.entity_id     = l.id::text
                 AND al.created_at    > now() - interval '23 hours'
             )
    LOOP
      v_ok := true; v_err := NULL;
      BEGIN
        FOR r_action IN SELECT * FROM automation_resolve_actions(to_jsonb(r_auto)) LOOP
          PERFORM automation_execute_action(
            r_action.action_type, r_action.action_config,
            r_lead.id, r_lead.profile_id, v_owner_id
          );
        END LOOP;
        UPDATE automations SET runs = COALESCE(runs,0)+1, last_run = now() WHERE id = r_auto.id;
      EXCEPTION WHEN OTHERS THEN
        v_ok := false; v_err := SQLERRM;
      END;
      INSERT INTO automation_logs(automation_id,profile_id,automation_name,trigger_label,status,error_message,entity_id)
      VALUES(r_auto.id,r_auto.profile_id,r_auto.name,'😴 Lead inactif',
             CASE WHEN v_ok THEN 'ok' ELSE 'error' END, v_err, r_lead.id::text);
    END LOOP;
  END LOOP;
END;
$function$;
