-- Retour arrière de 20261003000000_crm_tasks.sql
-- ⚠ Supprime définitivement toutes les tâches de la table crm_tasks.
-- À n'exécuter qu'APRÈS le retour arrière de 20261003010000 (les fonctions de relance utilisent crm_tasks).
SELECT cron.unschedule('crm-task-reminders');
DROP FUNCTION IF EXISTS public.crm_send_task_reminders();
DROP TABLE IF EXISTS public.crm_tasks;
DROP FUNCTION IF EXISTS public.crm_tasks_touch();

-- Contrainte d'origine de lead_activities.type (sans 'task_created') :
-- les lignes 'task_created' sont d'abord supprimées, sinon la contrainte ne peut pas être recréée.
DELETE FROM public.lead_activities WHERE type = 'task_created';
ALTER TABLE public.lead_activities DROP CONSTRAINT IF EXISTS lead_activities_type_check;
ALTER TABLE public.lead_activities ADD CONSTRAINT lead_activities_type_check
  CHECK (type = ANY (ARRAY['created','status','note','whatsapp','edited','task','task_done']));
