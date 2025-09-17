-- Schema for Senior Care Central - Agencies & Services
-- Run in Supabase SQL editor. Enables RLS and minimal constraints.

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
  status text not null default 'draft' check (status in ('draft','published','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agencies enable row level security;

-- Providers can insert their own agency row
create policy if not exists agencies_insert_self on public.agencies
for insert to authenticated
with check (owner_id = auth.uid());

-- Providers can view and update their own agency row
create policy if not exists agencies_select_self on public.agencies
for select to authenticated
using (owner_id = auth.uid());

create policy if not exists agencies_update_self on public.agencies
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Public read of published agencies (directory)
create policy if not exists agencies_select_published on public.agencies
for select to anon
using (status = 'published');

-- Services taxonomy
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

-- Public readable services taxonomy
create policy if not exists services_public_read on public.services
for select using (true);

-- Selected services for an agency
create table if not exists public.agency_services (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  primary key (agency_id, service_id)
);

alter table public.agency_services enable row level security;

create policy if not exists agency_services_rw_self on public.agency_services
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

create policy if not exists agency_strengths_rw_self on public.agency_service_strengths
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

create policy if not exists agency_rates_rw_self on public.agency_service_rates
for all to authenticated
using (agency_id in (select id from public.agencies where owner_id = auth.uid()))
with check (agency_id in (select id from public.agencies where owner_id = auth.uid()));

-- Storage buckets (run once)
-- select storage.create_bucket('agency-docs', public := false);
-- select storage.create_bucket('agency-photos', public := true);

-- Storage policies
-- Docs: only owner can read/write based on path prefix 'agency-<agency_id>/'
-- begin;
-- create policy if not exists docs_read_own on storage.objects for select to authenticated
--   using (
--     bucket_id = 'agency-docs' and exists (
--       select 1 from public.agencies a
--       where a.owner_id = auth.uid()
--         and position('agency-' || a.id || '/' in name) = 1
--     )
--   );
-- create policy if not exists docs_write_own on storage.objects for insert to authenticated
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
-- create policy if not exists photos_public_read on storage.objects for select to anon using (bucket_id = 'agency-photos');
-- create policy if not exists photos_write_own on storage.objects for insert to authenticated
--   with check (
--     bucket_id = 'agency-photos' and exists (
--       select 1 from public.agencies a
--       where a.owner_id = auth.uid()
--         and position('agency-' || a.id || '/' in name) = 1
--     )
--   );
-- commit;


