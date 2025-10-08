-- Seed a family + patient with preferences that will match seeded agencies
-- Usage: run this whole file in Supabase SQL editor

-- INPUT: replace this with your target auth user id if needed
-- Provided by user
-- 5a9d6842-53cb-4a24-8cda-d0d635a2b251

-- 1) Ensure family exists for the given user
insert into public.families (id, user_id, full_name, phone, created_at, updated_at)
values (
  gen_random_uuid(),
  '5a9d6842-53cb-4a24-8cda-d0d635a2b251',
  'Test Family (Matches Seed)',
  '(206) 555-2000',
  now(),
  now()
)
on conflict (user_id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  updated_at = now();

-- 2) Create a patient under this family
with f as (
  select id from public.families where user_id = '5a9d6842-53cb-4a24-8cda-d0d635a2b251'
)
insert into public.patients (
  id,
  family_id,
  full_name,
  age,
  relationship,
  care_level,
  status,
  created_at
)
values (
  gen_random_uuid(),
  (select id from f),
  'Jane Seed Patient',
  78,
  'mother',
  'assisted',
  'active',
  now()
);

-- 3) Preferences: Seattle WA context, monthly budget fits many agencies
-- Store selected services as jsonb array; levels use strings expected by matching
do $$
declare
  v_patient_id uuid;
begin
  select id into v_patient_id from public.patients
  where family_id = (select id from public.families where user_id = '5a9d6842-53cb-4a24-8cda-d0d635a2b251')
  order by created_at desc limit 1;

  -- Replace existing preferences (if any) then insert fresh
  delete from public.patient_care_preferences where patient_id = v_patient_id;

  insert into public.patient_care_preferences (
    id,
    patient_id,
    selected_services,
    schedule_preferences,
    budget_preferences,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    v_patient_id,
    jsonb_build_array(
      jsonb_build_object('serviceId','mobility-assistance','level','full','aiSuggested',true),
      jsonb_build_object('serviceId','medication-management','level','full','aiSuggested',true),
      jsonb_build_object('serviceId','bathing-dressing','level','full','aiSuggested',true),
      jsonb_build_object('serviceId','memory-care','level','substantial','aiSuggested',true)
    ),
    jsonb_build_object(
      'days', jsonb_build_array('monday','wednesday','friday'),
      'timeBlocks', jsonb_build_array('morning','afternoon'),
      'frequency', '3',
      'isFlexible', false
    ),
    jsonb_build_object(
      'amount', 2000,
      'timeframe', 'monthly',
      'flexibility', 'yes',
      'note', ''
    ),
    now(),
    now()
  );
end $$ language plpgsql;

-- Optional: minimal service requirements table (not required by matcher now)
-- Uncomment if you want explicit support levels stored separately
-- insert into public.patient_service_requirements (patient_id, service_id, support_level)
-- select v_patient_id, s.id, lvl from (
--   values ('mobility-assistance',4),('medication-management',4),('bathing-dressing',4),('memory-care',3)
-- ) x(slug,lvl)
-- join public.services s on s.slug = x.slug
-- on conflict (patient_id, service_id) do update set support_level = excluded.support_level;


