-- ─────────────────────────────────────────────────────────────────────────────
-- Visites de profil : détection des robots côté base (défense en profondeur).
-- Le filtre navigateur (PublicProfile.jsx, [TRK2]) existe déjà ; ceci protège aussi
-- contre les appels directs à l'Edge Function track-profile-visit et nettoie l'historique.
-- Les visites de robots sont CONSERVÉES et marquées (is_bot) : rien n'est supprimé.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profile_visits
  ADD COLUMN IF NOT EXISTS is_bot     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason text;

-- Retourne le motif (mot-clé détecté) ou NULL si le user-agent semble humain.
-- « \mbot\M » (mot entier) et non « bot » seul : évite de bloquer des téléphones
-- dont le modèle contient « bot » (ex. Cubot P20).
CREATE OR REPLACE FUNCTION public.bot_user_agent_reason(p_ua text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = pg_catalog AS $$
  SELECT CASE
    WHEN p_ua IS NULL OR btrim(p_ua) = '' THEN 'ua_vide'
    ELSE lower(substring(p_ua from
      '(?i)(lighthouse|pagespeed|gtmetrix|headlesschrome|phantomjs|puppeteer|playwright|selenium|googlebot|bingbot|\mbot\M|bot/[0-9]|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp/|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|applebot|bingpreview|google-read-aloud|googleother|google-inspectiontool|adsbot|mediapartners|duplexweb|feedfetcher|pingdom|uptimerobot|statuscake|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|perplexity|amazonbot|yandex|baidu|duckduckbot|sogou|exabot|ia_archiver|curl/|wget/|python-requests|python-urllib|go-http-client|axios/|node-fetch|\+https?://)'))
  END
$$;

-- Classement automatique à chaque nouvelle visite (aucun redéploiement nécessaire)
CREATE OR REPLACE FUNCTION public.profile_visits_classify()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  NEW.bot_reason := public.bot_user_agent_reason(NEW.user_agent);
  NEW.is_bot     := NEW.bot_reason IS NOT NULL;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profile_visits_classify_trg ON public.profile_visits;
CREATE TRIGGER profile_visits_classify_trg
  BEFORE INSERT ON public.profile_visits
  FOR EACH ROW EXECUTE FUNCTION public.profile_visits_classify();

-- Historique
UPDATE public.profile_visits
   SET bot_reason = public.bot_user_agent_reason(user_agent),
       is_bot     = public.bot_user_agent_reason(user_agent) IS NOT NULL
 WHERE is_bot = false AND public.bot_user_agent_reason(user_agent) IS NOT NULL;

CREATE INDEX IF NOT EXISTS profile_visits_human_idx
  ON public.profile_visits (profile_id, visited_at DESC) WHERE NOT is_bot;
