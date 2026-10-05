-- ─────────────────────────────────────────────────────────────────────────────
-- Fiche contact unique : timeline unifiée d'un lead.
-- Rassemble les événements dispersés (activités, réservations, formulaires,
-- messages du profil, événements, billets, messages et notes WhatsApp) en
-- rapprochant par téléphone normalisé (normalize_phone_ci) ou e-mail.
--
-- SECURITY DEFINER avec contrôle de propriété explicite : seul le propriétaire
-- du profil du lead peut lire sa timeline (auth.uid()).
-- Non relié faute d'identité : profile_visits (IP seule, pas de visiteur).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS bookings_profile_phone_idx
  ON public.bookings (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_contacts_profile_idx
  ON public.profile_contacts (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_activities_lead_idx
  ON public.lead_activities (lead_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.crm_contact_timeline(p_lead_id uuid, p_limit integer DEFAULT 150)
RETURNS TABLE (event_at timestamptz, kind text, title text, detail text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_lead  leads%ROWTYPE;
  v_owner uuid;
  v_phone text;
  v_email text;
BEGIN
  -- Contrôle de propriété : le lead doit appartenir à un profil de l'utilisateur connecté
  SELECT l.* INTO v_lead
    FROM leads l
   WHERE l.id = p_lead_id
     AND EXISTS (SELECT 1 FROM link_profiles p
                  WHERE p.id = l.profile_id AND p.user_id = auth.uid());
  IF NOT FOUND THEN
    RAISE EXCEPTION 'acces_refuse' USING ERRCODE = '42501';
  END IF;
  SELECT p.user_id INTO v_owner FROM link_profiles p WHERE p.id = v_lead.profile_id;

  v_phone := v_lead.phone_norm;
  v_email := NULLIF(lower(btrim(v_lead.email)), '');

  RETURN QUERY
  SELECT t.event_at, t.kind, t.title, t.detail FROM (

    -- Activités du lead (création, statut, notes, WhatsApp, tâches…)
    SELECT a.created_at AS event_at, a.type AS kind,
           CASE a.type
             WHEN 'created'      THEN 'Contact créé'
             WHEN 'status'       THEN 'Statut modifié'
             WHEN 'note'         THEN 'Note'
             WHEN 'whatsapp'     THEN 'WhatsApp'
             WHEN 'edited'       THEN 'Fiche modifiée'
             WHEN 'task'         THEN 'Tâche'
             WHEN 'task_created' THEN 'Tâche créée'
             WHEN 'task_done'    THEN 'Tâche terminée'
             ELSE 'Activité' END AS title,
           a.description AS detail
      FROM lead_activities a WHERE a.lead_id = v_lead.id

    UNION ALL
    -- Réservations (lien direct lead_id, sinon téléphone / e-mail)
    SELECT b.created_at, 'booking',
           'Réservation ' || CASE b.status WHEN 'confirmed' THEN 'confirmée'
                                           WHEN 'cancelled' THEN 'annulée'
                                           WHEN 'no_show'   THEN '(absent)'
                                           ELSE COALESCE(b.status, '') END,
           'Le ' || to_char(b.booking_date, 'DD/MM/YYYY')
             || COALESCE(' à ' || to_char(b.start_time, 'HH24:MI'), '')
             || COALESCE(' — ' || s.name, '')
      FROM bookings b LEFT JOIN booking_services s ON s.id = b.service_id
     WHERE b.profile_id = v_lead.profile_id
       AND (b.lead_id = v_lead.id
            OR (v_phone IS NOT NULL AND normalize_phone_ci(b.client_phone) = v_phone)
            OR (v_email IS NOT NULL AND lower(btrim(b.client_email)) = v_email))

    UNION ALL
    -- Formulaires remplis (champ téléphone ou e-mail de la soumission)
    SELECT fs.created_at, 'form', 'Formulaire rempli', f.title
      FROM form_submissions fs JOIN forms f ON f.id = fs.form_id
     WHERE f.profile_id = v_lead.profile_id
       AND jsonb_typeof(f.fields) = 'array'
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(f.fields) e
          WHERE (e->>'type' = 'phone' AND v_phone IS NOT NULL
                 AND normalize_phone_ci(fs.data->>(e->>'id')) = v_phone)
             OR (e->>'type' = 'email' AND v_email IS NOT NULL
                 AND lower(btrim(fs.data->>(e->>'id'))) = v_email))

    UNION ALL
    -- Messages envoyés depuis le formulaire de contact du profil
    SELECT c.created_at, 'contact_message', 'Message reçu via le profil', left(c.message, 300)
      FROM profile_contacts c
     WHERE c.profile_id = v_lead.profile_id AND v_phone IS NOT NULL
       AND normalize_phone_ci(c.phone) = v_phone

    UNION ALL
    -- Intérêt pour un événement
    SELECT el.created_at, 'event_lead', 'Intérêt pour un événement',
           ev.title || COALESCE(' — ' || el.interest, '')
      FROM event_leads el JOIN events ev ON ev.id = el.event_id
     WHERE ev.owner_user_id = v_owner AND v_phone IS NOT NULL
       AND normalize_phone_ci(el.phone) = v_phone

    UNION ALL
    -- Inscription à un événement (RSVP)
    SELECT r.created_at, 'event_rsvp', 'Inscription à un événement',
           ev.title || COALESCE(' — ' || r.guests || ' invité(s)', '')
      FROM event_rsvps r JOIN events ev ON ev.id = r.event_id
     WHERE ev.owner_user_id = v_owner AND v_phone IS NOT NULL
       AND normalize_phone_ci(r.phone) = v_phone

    UNION ALL
    -- Billets commandés
    SELECT o.created_at, 'ticket', 'Commande de billets',
           o.quantity || ' billet(s) — ' || o.total_amount || ' FCFA — ' || COALESCE(o.payment_status, '')
      FROM ticket_orders o
     WHERE o.profile_id = v_lead.profile_id
       AND ((v_phone IS NOT NULL AND normalize_phone_ci(o.buyer_phone) = v_phone)
         OR (v_email IS NOT NULL AND lower(btrim(o.buyer_email)) = v_email))

    UNION ALL
    -- Messages WhatsApp (journal)
    SELECT m.created_at,
           CASE WHEN m.direction = 'in' THEN 'wa_in' ELSE 'wa_out' END,
           CASE WHEN m.direction = 'in' THEN 'Message WhatsApp reçu' ELSE 'Message WhatsApp envoyé' END,
           left(m.message, 300)
      FROM whatsapp_messages m
     WHERE m.user_id = v_owner AND v_phone IS NOT NULL
       AND normalize_phone_ci(m.contact_phone) = v_phone

    UNION ALL
    -- Notes du WhatsApp CRM
    SELECT n.created_at, 'note', 'Note WhatsApp CRM', n.body
      FROM whatsapp_contact_notes n JOIN whatsapp_contacts w ON w.id = n.contact_id
     WHERE w.user_id = v_owner AND v_phone IS NOT NULL AND w.phone_norm = v_phone

  ) t
  ORDER BY t.event_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 150), 1), 500);
END $$;

REVOKE ALL ON FUNCTION public.crm_contact_timeline(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_contact_timeline(uuid, integer) TO authenticated;
