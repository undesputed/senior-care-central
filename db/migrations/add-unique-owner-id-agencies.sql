-- Migration: Add unique constraint to agencies.owner_id to prevent duplicates
-- Run this in Supabase SQL editor

-- First, remove any duplicate agencies (keep the first one for each owner_id)
WITH duplicates AS (
  SELECT 
    owner_id,
    MIN(created_at) as first_created
  FROM public.agencies
  GROUP BY owner_id
  HAVING COUNT(*) > 1
),
to_delete AS (
  SELECT a.id
  FROM public.agencies a
  JOIN duplicates d ON a.owner_id = d.owner_id
  WHERE a.created_at > d.first_created
)
DELETE FROM public.agencies 
WHERE id IN (SELECT id FROM to_delete);

-- Add the unique constraint
ALTER TABLE public.agencies 
ADD CONSTRAINT agencies_owner_id_unique UNIQUE (owner_id);

-- Verify the constraint was added
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.agencies'::regclass 
AND conname = 'agencies_owner_id_unique';
