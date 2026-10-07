-- Retour arrière de 20261003020000_crm_contact_timeline.sql
DROP FUNCTION IF EXISTS public.crm_contact_timeline(uuid, integer);
DROP INDEX IF EXISTS public.bookings_profile_phone_idx;
DROP INDEX IF EXISTS public.profile_contacts_profile_idx;
DROP INDEX IF EXISTS public.lead_activities_lead_idx;
