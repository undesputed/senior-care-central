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
  owner_id uuid not null references auth.users(id) on delete cascade,
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


