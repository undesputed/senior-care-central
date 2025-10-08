-- Schema for Senior Care Central - Agencies & Services
-- Run in Supabase SQL editor. Enables RLS and minimal constraints.

-- User profiles (linked to auth.users) with role
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'provider' check (role in ('provider','family','admin')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert to authenticated with check (id = auth.uid());

-- Family accounts (one-to-one with profiles where role = 'family')
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text,
  phone text,
  phone_number text,
  preferred_contact_method text check (preferred_contact_method in ('email', 'phone', 'sms')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Patients (many-to-one with families)
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  full_name text not null,
  age int,
  relationship text, -- e.g., 'Mother', 'Father', 'Spouse', 'Self'
  care_level text check (care_level in ('independent', 'assisted', 'skilled', 'memory_care', 'hospice')),
  medical_conditions text[],
  care_needs text[],
  status text not null default 'active' check (status in ('active', 'inactive', 'deceased')),
  notes text,
  -- Location fields for matching
  city text,
  state text,
  zip_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.families enable row level security;

drop policy if exists families_rw_self on public.families;
create policy families_rw_self on public.families
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.patients enable row level security;

drop policy if exists patients_rw_own_family on public.patients;
create policy patients_rw_own_family on public.patients
for all to authenticated 
using (family_id in (select id from public.families where user_id = auth.uid()))
with check (family_id in (select id from public.families where user_id = auth.uid()));

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text,
  business_registration_number text,
  year_established int,
  website text,
  logo_url text,
  phone text,
  email text,
  admin_contact_name text,
  cities text[],
  postal_codes text[],
  coverage_radius_km int,
  description text,
  permit_verified boolean not null default false,
  onboarding_completed boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agencies enable row level security;

-- Providers can insert their own agency row
drop policy if exists agencies_insert_self on public.agencies;
create policy agencies_insert_self on public.agencies
for insert to authenticated
with check (owner_id = auth.uid());

-- Providers can view and update their own agency row
drop policy if exists agencies_select_self on public.agencies;
create policy agencies_select_self on public.agencies
for select to authenticated
using (owner_id = auth.uid());

drop policy if exists agencies_update_self on public.agencies;
create policy agencies_update_self on public.agencies
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Public read of published agencies (directory)
drop policy if exists agencies_select_published on public.agencies;
create policy agencies_select_published on public.agencies
for select to anon
using (status = 'published');

-- Agency service areas (normalized, multiple cities/states per agency)
create table if not exists public.agency_service_areas (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  city text not null,
  state text not null,
  created_at timestamptz not null default now()
);

alter table public.agency_service_areas enable row level security;

drop policy if exists areas_rw_self on public.agency_service_areas;
create policy areas_rw_self on public.agency_service_areas
for all to authenticated
using (agency_id in (select id from public.agencies where owner_id = auth.uid()))
with check (agency_id in (select id from public.agencies where owner_id = auth.uid()));

-- Services taxonomy
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category text,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

-- Public readable services taxonomy
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
for select using (true);

-- Seed basic services
insert into public.services (slug, name, description, category) values
('personal-care', 'Personal Care', 'Assistance with daily personal hygiene and grooming', 'Daily Living'),
('meal-preparation', 'Meal Preparation', 'Help with cooking and meal planning', 'Daily Living'),
('medication-management', 'Medication Management', 'Assistance with taking medications correctly', 'Medical'),
('mobility-assistance', 'Mobility Assistance', 'Help with walking, transferring, and movement', 'Mobility'),
('housekeeping', 'Housekeeping', 'Light housekeeping and cleaning services', 'Daily Living'),
('companionship', 'Companionship', 'Social interaction and emotional support', 'Companionship'),
('transportation', 'Transportation', 'Rides to appointments and errands', 'Transportation'),
('bathing-dressing', 'Bathing & Dressing', 'Assistance with bathing and getting dressed', 'Personal Care'),
('transfer-assistance', 'Transfer Assistance', 'Help moving between bed, chair, and wheelchair', 'Mobility'),
('laundry', 'Laundry Services', 'Washing and folding clothes', 'Daily Living'),
('shopping', 'Shopping Assistance', 'Help with grocery shopping and errands', 'Daily Living'),
('exercise-therapy', 'Exercise & Therapy', 'Physical therapy and exercise assistance', 'Medical'),
('memory-care', 'Memory Care', 'Specialized care for dementia and memory issues', 'Medical'),
('respite-care', 'Respite Care', 'Temporary care to give family caregivers a break', 'Companionship'),
('24-hour-care', '24-Hour Care', 'Round-the-clock care and supervision', 'Medical')
on conflict (slug) do nothing;

-- Fix existing AI analysis data that has mock service IDs
-- This updates any existing patient_ai_analysis records to use service names instead of mock IDs
update public.patient_ai_analysis 
set suggested_services = (
  select jsonb_agg(
    case 
      when (service->>'serviceId')::text ~ '^[0-9]+$' then
        -- If serviceId is numeric (mock ID), try to map by service name
        jsonb_build_object(
          'serviceId', 
          coalesce(
            (select id::text from public.services where name = service->>'serviceName'),
            service->>'serviceId' -- fallback to original if no match
          ),
          'serviceName', service->>'serviceName',
          'level', service->>'level',
          'confidence', service->>'confidence',
          'reasoning', service->>'reasoning'
        )
      else
        -- Keep as is if already a UUID or valid format
        service
    end
  )
  from jsonb_array_elements(suggested_services) as service
)
where suggested_services is not null;

-- Selected services for an agency
create table if not exists public.agency_services (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  primary key (agency_id, service_id)
);

alter table public.agency_services enable row level security;

drop policy if exists agency_services_rw_self on public.agency_services;
create policy agency_services_rw_self on public.agency_services
for all to authenticated
using (agency_id in (select id from public.agencies where owner_id = auth.uid()))
with check (agency_id in (select id from public.agencies where owner_id = auth.uid()));

-- Strength points for selected services (0-5 each, total suggested cap 20 UI)
create table if not exists public.agency_service_strengths (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  points int not null default 0 check (points between 0 and 5),
  primary key (agency_id, service_id)
);

alter table public.agency_service_strengths enable row level security;

drop policy if exists agency_strengths_rw_self on public.agency_service_strengths;
create policy agency_strengths_rw_self on public.agency_service_strengths
for all to authenticated
using (agency_id in (select id from public.agencies where owner_id = auth.uid()))
with check (agency_id in (select id from public.agencies where owner_id = auth.uid()));

-- Ensure total stars per agency sum to 20 (enforced via trigger)
create or replace function public.enforce_total_strength_points()
returns trigger as $$
declare total int;
begin
  select coalesce(sum(points),0) into total from public.agency_service_strengths where agency_id = new.agency_id;
  if total > 20 then
    raise exception 'Total agency strength points exceeds 20 (%)', total;
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_enforce_total_strength_points_insupd on public.agency_service_strengths;
create trigger trg_enforce_total_strength_points_insupd
after insert or update on public.agency_service_strengths
for each row execute procedure public.enforce_total_strength_points();

-- Rates per service
create table if not exists public.agency_service_rates (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  pricing_format text not null default 'hourly' check (pricing_format in ('hourly','monthly')),
  currency text not null default 'USD',
  min_amount numeric(10,2),
  max_amount numeric(10,2),
  primary key (agency_id, service_id)
);

alter table public.agency_service_rates enable row level security;

drop policy if exists agency_rates_rw_self on public.agency_service_rates;
create policy agency_rates_rw_self on public.agency_service_rates
for all to authenticated
using (agency_id in (select id from public.agencies where owner_id = auth.uid()))
with check (agency_id in (select id from public.agencies where owner_id = auth.uid()));

-- Patient required services with support levels
create table if not exists public.patient_service_requirements (
  patient_id uuid not null references public.patients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  support_level int not null check (support_level between 1 and 4),
  primary key (patient_id, service_id)
);

alter table public.patient_service_requirements enable row level security;

drop policy if exists psr_rw_own_family on public.patient_service_requirements;
create policy psr_rw_own_family on public.patient_service_requirements
for all to authenticated
using (
  patient_id in (
    select p.id from public.patients p
    join public.families f on f.id = p.family_id
    where f.user_id = auth.uid()
  )
)
with check (
  patient_id in (
    select p.id from public.patients p
    join public.families f on f.id = p.family_id
    where f.user_id = auth.uid()
  )
);

-- Persisted care matches
create table if not exists public.care_matches (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  score numeric(5,2) not null check (score between 0 and 100),
  breakdown jsonb not null,
  tags jsonb not null,
  created_at timestamptz not null default now(),
  unique (patient_id, agency_id)
);

alter table public.care_matches enable row level security;

drop policy if exists care_matches_rw_own_family on public.care_matches;
create policy care_matches_rw_own_family on public.care_matches
for all to authenticated
using (
  patient_id in (
    select p.id from public.patients p
    join public.families f on f.id = p.family_id
    where f.user_id = auth.uid()
  )
)
with check (
  patient_id in (
    select p.id from public.patients p
    join public.families f on f.id = p.family_id
    where f.user_id = auth.uid()
  )
);

-- Agency uploads table
create table if not exists public.agency_uploads (
  id uuid not null default gen_random_uuid() primary key,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  file_type text not null check (file_type in ('registration', 'background_check', 'training', 'photo')),
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text not null,
  photo_category text check (photo_category in ('care_team', 'facilities', 'clients')),
  created_at timestamptz not null default now()
);

alter table public.agency_uploads enable row level security;

drop policy if exists agency_uploads_select_own on public.agency_uploads;
create policy agency_uploads_select_own on public.agency_uploads
for select to authenticated
using (agency_id in (select id from public.agencies where owner_id = auth.uid()));

drop policy if exists agency_uploads_insert_own on public.agency_uploads;
create policy agency_uploads_insert_own on public.agency_uploads
for insert to authenticated
with check (agency_id in (select id from public.agencies where owner_id = auth.uid()));

drop policy if exists agency_uploads_delete_own on public.agency_uploads;
create policy agency_uploads_delete_own on public.agency_uploads
for delete to authenticated
using (agency_id in (select id from public.agencies where owner_id = auth.uid()));

-- Storage buckets (run once)
-- select storage.create_bucket('agency-docs', public := false);
-- select storage.create_bucket('agency-photos', public := true);

-- Storage policies
-- Docs: only owner can read/write based on path prefix 'agency-<agency_id>/'
-- begin;
-- drop policy if exists docs_read_own on storage.objects;
-- create policy docs_read_own on storage.objects for select to authenticated
--   using (
--     bucket_id = 'agency-docs' and exists (
--       select 1 from public.agencies a
--       where a.owner_id = auth.uid()
--         and position('agency-' || a.id || '/' in name) = 1
--     )
--   );
-- drop policy if exists docs_write_own on storage.objects;
-- create policy docs_write_own on storage.objects for insert to authenticated
--   with check (
--     bucket_id = 'agency-docs' and exists (
--       select 1 from public.agencies a
--       where a.owner_id = auth.uid()
--         and position('agency-' || a.id || '/' in name) = 1
--     )
--   );
-- commit;

-- Photos: public read, owner write based on path prefix
-- begin;
-- drop policy if exists photos_public_read on storage.objects;
-- create policy photos_public_read on storage.objects for select to anon using (bucket_id = 'agency-photos');
-- drop policy if exists photos_write_own on storage.objects;
-- create policy photos_write_own on storage.objects for insert to authenticated
--   with check (
--     bucket_id = 'agency-photos' and exists (
--       select 1 from public.agencies a
--       where a.owner_id = auth.uid()
--         and position('agency-' || a.id || '/' in name) = 1
--     )
--   );
-- commit;
-- =============================
-- Patient Onboarding (Families)
-- =============================

-- Sessions for patient onboarding lifecycle
create table if not exists public.patient_onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  current_step int not null default 1,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patient_onboarding_sessions enable row level security;

drop policy if exists pos_rw_own_family on public.patient_onboarding_sessions;
create policy pos_rw_own_family on public.patient_onboarding_sessions
for all to authenticated
using (family_id in (select id from public.families where user_id = auth.uid()))
with check (family_id in (select id from public.families where user_id = auth.uid()));

-- Conversation history for AI-assisted intake (user/ai messages)
create table if not exists public.patient_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.patient_onboarding_sessions(id) on delete cascade,
  message_type text not null check (message_type in ('user','ai')),
  content text not null,
  detected_entities jsonb,
  follow_up_questions jsonb,
  created_at timestamptz not null default now()
);

alter table public.patient_ai_conversations enable row level security;

drop policy if exists paic_rw_own_family on public.patient_ai_conversations;
create policy paic_rw_own_family on public.patient_ai_conversations
for all to authenticated
using (
  session_id in (
    select s.id from public.patient_onboarding_sessions s
    join public.families f on f.id = s.family_id
    where f.user_id = auth.uid()
  )
)
with check (
  session_id in (
    select s.id from public.patient_onboarding_sessions s
    join public.families f on f.id = s.family_id
    where f.user_id = auth.uid()
  )
);

-- Finalized AI analysis (entities + suggested services)
create table if not exists public.patient_ai_analysis (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.patient_onboarding_sessions(id) on delete cascade,
  detected_conditions text[] not null,
  care_needs text[] not null,
  suggested_services jsonb not null,
  confidence_score numeric(3,2) not null,
  analysis_complete boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.patient_ai_analysis enable row level security;

drop policy if exists paia_rw_own_family on public.patient_ai_analysis;
create policy paia_rw_own_family on public.patient_ai_analysis
for all to authenticated
using (
  session_id in (
    select s.id from public.patient_onboarding_sessions s
    join public.families f on f.id = s.family_id
    where f.user_id = auth.uid()
  )
)
with check (
  session_id in (
    select s.id from public.patient_onboarding_sessions s
    join public.families f on f.id = s.family_id
    where f.user_id = auth.uid()
  )
);

-- Patient care preferences (services, schedule, budget)
create table if not exists public.patient_care_preferences (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  selected_services jsonb not null,
  schedule_preferences jsonb not null,
  budget_preferences jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patient_care_preferences enable row level security;

drop policy if exists pcp_rw_own_family on public.patient_care_preferences;
create policy pcp_rw_own_family on public.patient_care_preferences
for all to authenticated
using (
  patient_id in (
    select p.id from public.patients p
    join public.families f on f.id = p.family_id
    where f.user_id = auth.uid()
  )
)
with check (
  patient_id in (
    select p.id from public.patients p
    join public.families f on f.id = p.family_id
    where f.user_id = auth.uid()
  )
);

-- Uploaded files (private storage; URLs via signed links)
create table if not exists public.patient_uploaded_files (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.patient_onboarding_sessions(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size int not null,
  uploaded_at timestamptz not null default now()
);

alter table public.patient_uploaded_files enable row level security;

drop policy if exists puf_rw_own_family on public.patient_uploaded_files;
create policy puf_rw_own_family on public.patient_uploaded_files
for all to authenticated
using (
  session_id in (
    select s.id from public.patient_onboarding_sessions s
    join public.families f on f.id = s.family_id
    where f.user_id = auth.uid()
  )
)
with check (
  session_id in (
    select s.id from public.patient_onboarding_sessions s
    join public.families f on f.id = s.family_id
    where f.user_id = auth.uid()
  )
);

-- =============================
-- Storage: patient documents bucket (private)
-- =============================

-- select storage.create_bucket('patient-documents', public := false);

-- Access policies for patient-documents bucket
-- Read/Write/Delete restricted by pathing rules you implement in app; here we scope by bucket only,
-- and rely on application to generate signed URLs for downloads.
-- Example policies to allow authenticated users to interact only with this bucket.

-- begin;
-- drop policy if exists patient_docs_select on storage.objects;
-- create policy patient_docs_select on storage.objects
--   for select to authenticated using (bucket_id = 'patient-documents');
-- drop policy if exists patient_docs_insert on storage.objects;
-- create policy patient_docs_insert on storage.objects
--   for insert to authenticated with check (bucket_id = 'patient-documents');
-- drop policy if exists patient_docs_delete on storage.objects;
-- create policy patient_docs_delete on storage.objects
--   for delete to authenticated using (bucket_id = 'patient-documents');
-- commit;

-- ============================================
-- Maintenance: Cleanup incomplete onboarding
-- ============================================
create or replace function public.cleanup_incomplete_patient_onboarding(max_hours integer default 24)
returns void
language plpgsql
security definer
as $$
declare
  cutoff timestamptz := now() - (max_hours || ' hours')::interval;
  s record;
begin
  for s in
    select id from public.patient_onboarding_sessions
    where is_completed = false and updated_at < cutoff
  loop
    -- delete related rows; storage object deletions are handled at application layer
    delete from public.patient_ai_conversations where session_id = s.id;
    delete from public.patient_ai_analysis where session_id = s.id;
    delete from public.patient_care_preferences where session_id = s.id;
    delete from public.patient_uploaded_files where session_id = s.id;
    delete from public.patient_onboarding_sessions where id = s.id;
  end loop;
end;
$$;

grant execute on function public.cleanup_incomplete_patient_onboarding(integer) to service_role;

-- ========================================
-- CONTRACTS TABLE
-- ========================================

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null unique, -- e.g., #CW-2025-1047
  agency_id uuid not null references public.agencies(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  
  -- Contract Status
  status text not null default 'draft' check (status in ('draft', 'sent', 'under_review', 'accepted', 'rejected', 'cancelled', 'completed')),
  
  -- Basic Details
  client_name text not null,
  client_phone text,
  client_email text,
  care_recipient_name text not null,
  care_recipient_age integer,
  care_recipient_address text,
  care_recipient_conditions jsonb default '[]'::jsonb,
  
  -- Provider Details
  provider_name text not null,
  provider_address text,
  provider_email text,
  provider_phone text,
  
  -- Plan Details
  selected_services jsonb default '[]'::jsonb,
  custom_services jsonb default '[]'::jsonb,
  care_type text not null default 'In-home senior care',
  care_schedule jsonb default '[]'::jsonb, -- days of week
  care_times jsonb default '[]'::jsonb, -- time blocks
  min_sessions integer default 0,
  max_sessions integer default 0,
  start_date date,
  end_date date,
  
  -- Payment Terms
  effective_date text not null,
  payment_method text not null default 'Credit Card',
  billing_type text not null default 'Monthly',
  rate decimal(10,2) default 0,
  
  -- Legal Terms
  terms_and_conditions text,
  cancellation_disputes text,
  platform_disclaimer text,
  acceptance_terms text,
  terms_accepted boolean default false,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz
);

-- Enable RLS
alter table public.contracts enable row level security;

-- RLS Policies for contracts
create policy contracts_select_agency on public.contracts
for select to authenticated
using (
  agency_id in (
    select id from public.agencies 
    where owner_id = auth.uid()
  )
);

create policy contracts_select_family on public.contracts
for select to authenticated
using (family_id in (
  select id from public.families 
  where user_id = auth.uid()
));

create policy contracts_insert_agency on public.contracts
for insert to authenticated
with check (
  agency_id in (
    select id from public.agencies 
    where owner_id = auth.uid()
  )
);

create policy contracts_update_agency on public.contracts
for update to authenticated
using (
  agency_id in (
    select id from public.agencies 
    where owner_id = auth.uid()
  )
)
with check (
  agency_id in (
    select id from public.agencies 
    where owner_id = auth.uid()
  )
);

create policy contracts_update_family on public.contracts
for update to authenticated
using (family_id in (
  select id from public.families 
  where user_id = auth.uid()
))
with check (family_id in (
  select id from public.families 
  where user_id = auth.uid()
));

-- Indexes for better performance
create index idx_contracts_agency_id on public.contracts(agency_id);
create index idx_contracts_patient_id on public.contracts(patient_id);
create index idx_contracts_family_id on public.contracts(family_id);
create index idx_contracts_status on public.contracts(status);
create index idx_contracts_contract_id on public.contracts(contract_id);
create index idx_contracts_created_at on public.contracts(created_at);

-- Function to update updated_at timestamp
create or replace function public.update_contracts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger contracts_updated_at
  before update on public.contracts
  for each row
  execute function public.update_contracts_updated_at();

-- ========================================
-- INVOICES TABLE
-- ========================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,

  -- Stripe references
  stripe_invoice_id text unique,
  stripe_customer_id text,
  stripe_payment_intent_id text,

  -- Human-readable
  number text,
  status text not null default 'draft' check (status in ('draft','open','paid','uncollectible','void')),
  currency text not null default 'usd',

  -- Amounts in cents
  amount_subtotal integer not null default 0,
  amount_tax integer not null default 0,
  amount_total integer not null default 0,
  amount_due integer not null default 0,

  hosted_invoice_url text,
  pdf_url text,
  due_date timestamptz,
  lines jsonb default '[]'::jsonb,
  meta jsonb default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

-- RLS: Agencies (owners) can select/insert/update their invoices
drop policy if exists invoices_select_agency on public.invoices;
create policy invoices_select_agency on public.invoices
for select to authenticated
using (
  agency_id in (
    select id from public.agencies where owner_id = auth.uid()
  )
);

drop policy if exists invoices_insert_agency on public.invoices;
create policy invoices_insert_agency on public.invoices
for insert to authenticated
with check (
  agency_id in (
    select id from public.agencies where owner_id = auth.uid()
  )
);

drop policy if exists invoices_update_agency on public.invoices;
create policy invoices_update_agency on public.invoices
for update to authenticated
using (
  agency_id in (
    select id from public.agencies where owner_id = auth.uid()
  )
)
with check (
  agency_id in (
    select id from public.agencies where owner_id = auth.uid()
  )
);

-- RLS: Families can view invoices where they are the payer
drop policy if exists invoices_select_family on public.invoices;
create policy invoices_select_family on public.invoices
for select to authenticated
using (
  family_id in (
    select id from public.families where user_id = auth.uid()
  )
);

-- Indexes
create index if not exists idx_invoices_contract_id on public.invoices(contract_id);
create index if not exists idx_invoices_agency_id on public.invoices(agency_id);
create index if not exists idx_invoices_patient_id on public.invoices(patient_id);
create index if not exists idx_invoices_family_id on public.invoices(family_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_created_at on public.invoices(created_at);

-- updated_at trigger
create or replace function public.update_invoices_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger invoices_updated_at
  before update on public.invoices
  for each row
  execute function public.update_invoices_updated_at();

-- ========================================
-- NOTIFICATIONS TABLE (Provider + Family)
-- ========================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  -- audience
  role text not null check (role in ('provider','family')),
  agency_id uuid references public.agencies(id) on delete cascade,
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,

  -- content
  title text not null,
  body text not null,
  category text not null default 'contract_update',
  severity text not null default 'info' check (severity in ('info','success','warning','error')),

  -- linkage (optional)
  contract_id uuid references public.contracts(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete cascade,

  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Providers can see their agency notifications
drop policy if exists notifications_select_provider on public.notifications;
create policy notifications_select_provider on public.notifications
for select to authenticated
using (
  role = 'provider' and
  agency_id in (select id from public.agencies where owner_id = auth.uid())
);

-- Providers can insert notifications for their agency
drop policy if exists notifications_insert_provider on public.notifications;
create policy notifications_insert_provider on public.notifications
for insert to authenticated
with check (
  role = 'provider' and
  agency_id in (select id from public.agencies where owner_id = auth.uid())
);

-- Families can read their notifications
drop policy if exists notifications_select_family on public.notifications;
create policy notifications_select_family on public.notifications
for select to authenticated
using (
  role = 'family' and
  family_id in (select id from public.families where user_id = auth.uid())
);

-- Families can mark notifications as read
drop policy if exists notifications_update_family on public.notifications;
create policy notifications_update_family on public.notifications
for update to authenticated
using (
  role = 'family' and
  family_id in (select id from public.families where user_id = auth.uid())
)
with check (
  role = 'family' and
  family_id in (select id from public.families where user_id = auth.uid())
);

create index if not exists idx_notifications_agency on public.notifications(agency_id);
create index if not exists idx_notifications_family on public.notifications(family_id);
create index if not exists idx_notifications_role on public.notifications(role);
create index if not exists idx_notifications_created_at on public.notifications(created_at);

