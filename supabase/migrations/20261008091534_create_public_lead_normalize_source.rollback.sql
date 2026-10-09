-- Retour arrière de 20261008091534 : revient à la version qui réutilise le lead existant (sans traduction des sources)
CREATE OR REPLACE FUNCTION public.create_public_lead(
  p_profile_id bigint, p_name text, p_email text DEFAULT NULL::text, p_phone text DEFAULT NULL::text,
  p_notes text DEFAULT NULL::text, p_company text DEFAULT NULL::text, p_source text DEFAULT 'manuel'::text,
  p_tags text[] DEFAULT '{}'::text[], p_status text DEFAULT 'prospect'::text, p_score integer DEFAULT 50)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_lead_id uuid;
  v_is_owner boolean;
  v_tags text[];
  v_norm text;
begin
  if p_profile_id is null then
    raise exception 'invalid profile_id';
  end if;

  v_is_owner := exists (
    select 1 from link_profiles where id = p_profile_id and user_id = auth.uid()
  );

  if not v_is_owner and not exists (
    select 1 from link_profiles where id = p_profile_id and is_activated = true
  ) then
    raise exception 'invalid profile_id';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name is required';
  end if;

  if length(p_name) > 120 or length(coalesce(p_email, '')) > 254 or length(coalesce(p_phone, '')) > 30
     or length(coalesce(p_notes, '')) > 2000 or length(coalesce(p_company, '')) > 120
     or length(coalesce(p_source, '')) > 50 or length(coalesce(p_status, '')) > 30 then
    raise exception 'invalid input';
  end if;

  -- limite de débit : au plus 30 leads par minute et par profil pour les visiteurs
  if not v_is_owner and (
    select count(*) from leads
    where profile_id = p_profile_id and created_at > now() - interval '1 minute'
  ) >= 30 then
    raise exception 'too many requests';
  end if;

  select coalesce(array_agg(left(t, 30)), '{}'::text[]) into v_tags
  from (select t from unnest(coalesce(p_tags, '{}'::text[])) as t limit 10) s;

  -- [DOUBLON] même numéro (tous formats) déjà présent dans ce profil : on réutilise ce lead
  v_norm := nullif(normalize_phone_ci(nullif(trim(p_phone), '')), '');
  if v_norm is not null then
    select id into v_lead_id from leads where profile_id = p_profile_id and phone_norm = v_norm limit 1;
    if v_lead_id is not null then
      insert into lead_activities (lead_id, type, description)
      values (v_lead_id, 'note', 'Nouvelle prise de contact (' || coalesce(nullif(trim(p_source), ''), 'formulaire public') || ') : lead existant réutilisé');
      return v_lead_id;
    end if;
  end if;

  begin
    insert into leads (profile_id, name, email, phone, notes, company, source, tags, status, score)
    values (
      p_profile_id,
      trim(p_name),
      nullif(trim(p_email), ''),
      nullif(trim(p_phone), ''),
      p_notes,
      p_company,
      coalesce(p_source, 'manuel'),
      v_tags,
      coalesce(p_status, 'prospect'),
      least(100, greatest(0, coalesce(p_score, 50)))
    )
    returning id into v_lead_id;
  exception when unique_violation then
    -- deux envois simultanés du même numéro : l'autre a gagné, on réutilise son lead
    select id into v_lead_id from leads where profile_id = p_profile_id and phone_norm = v_norm limit 1;
    if v_lead_id is null then raise; end if;
    insert into lead_activities (lead_id, type, description)
    values (v_lead_id, 'note', 'Nouvelle prise de contact (' || coalesce(nullif(trim(p_source), ''), 'formulaire public') || ') : lead existant réutilisé');
    return v_lead_id;
  end;

  insert into lead_activities (lead_id, type, description)
  values (v_lead_id, 'created', 'Lead créé via formulaire public');

  return v_lead_id;
end;
$function$;
