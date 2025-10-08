-- Add location fields to patients table for matching
-- Migration: add-patient-location-fields.sql

-- Add location columns to patients table
alter table public.patients 
add column if not exists city text,
add column if not exists state text,
add column if not exists zip_code text;

-- Add comment for documentation
comment on column public.patients.city is 'Patient city for location-based matching';
comment on column public.patients.state is 'Patient state for location-based matching';
comment on column public.patients.zip_code is 'Patient zip code for location-based matching';
