-- Allow care_match_id to be NULL for direct invitation channels
-- This enables channels that are not tied to a specific care match

ALTER TABLE public.chat_channels 
ALTER COLUMN care_match_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL values
-- (PostgreSQL automatically handles this when we drop NOT NULL)
