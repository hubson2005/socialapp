-- Retour arrière de la correction des 5 leads « Visiteur » (profil 140) du 03/10/2026.
-- État d'origine : phone/phone_norm NULL, statut « client » ; automatisation form_submit en statut « client ».
UPDATE public.leads SET phone = NULL, status = 'client'
 WHERE id IN ('d523eece-ed4b-44d7-8876-c0f772a52dac','9fbf5614-e253-4629-98dd-bf1a6d2a21a9',
              '952c05f9-3350-4be4-8c24-1a39465bc934','f6a06a1a-0d4b-4884-80de-df7cb48a55a9',
              '2d43ea0a-6deb-445f-b07c-da585592474c');
UPDATE public.leads SET phone_norm = NULL
 WHERE id IN ('d523eece-ed4b-44d7-8876-c0f772a52dac','9fbf5614-e253-4629-98dd-bf1a6d2a21a9',
              '952c05f9-3350-4be4-8c24-1a39465bc934','f6a06a1a-0d4b-4884-80de-df7cb48a55a9',
              '2d43ea0a-6deb-445f-b07c-da585592474c');
DELETE FROM public.lead_activities
 WHERE type = 'edited' AND description LIKE 'Correction : téléphone repris du formulaire%';
UPDATE public.automations SET actions = jsonb_set(actions, '{0,config,status}', '"client"')
 WHERE id = '7f461572-c9bc-4774-9de4-4e014f941c27';
