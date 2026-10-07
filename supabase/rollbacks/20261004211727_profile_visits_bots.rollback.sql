DROP TRIGGER IF EXISTS profile_visits_classify_trg ON public.profile_visits;
DROP FUNCTION IF EXISTS public.profile_visits_classify();
DROP FUNCTION IF EXISTS public.bot_user_agent_reason(text);
DROP INDEX IF EXISTS public.profile_visits_human_idx;
ALTER TABLE public.profile_visits DROP COLUMN IF EXISTS bot_reason, DROP COLUMN IF EXISTS is_bot;
