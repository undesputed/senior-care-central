-- Add chat channels table for storing StreamChat channel details
-- This provides faster retrieval and additional metadata

CREATE TABLE IF NOT EXISTS public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  care_match_id uuid not null references public.care_matches(id) on delete cascade,
  stream_channel_id text not null unique,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  family_user_id uuid not null references auth.users(id) on delete cascade,
  channel_name text not null,
  status text not null default 'active' check (status in ('active', 'archived', 'closed')),
  last_message_at timestamptz,
  message_count integer not null default 0,
  agency_initiated boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Policy for agencies to access their channels
CREATE POLICY chat_channels_select_agency ON public.chat_channels
FOR SELECT TO authenticated
USING (
  agency_id IN (
    SELECT id FROM public.agencies 
    WHERE owner_id = auth.uid()
  )
);

-- Policy for families to access their channels
CREATE POLICY chat_channels_select_family ON public.chat_channels
FOR SELECT TO authenticated
USING (family_user_id = auth.uid());

-- Policy for agencies to insert channels
CREATE POLICY chat_channels_insert_agency ON public.chat_channels
FOR INSERT TO authenticated
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.agencies 
    WHERE owner_id = auth.uid()
  )
);

-- Policy for families to insert channels
CREATE POLICY chat_channels_insert_family ON public.chat_channels
FOR INSERT TO authenticated
WITH CHECK (family_user_id = auth.uid());

-- Policy for agencies to update their channels
CREATE POLICY chat_channels_update_agency ON public.chat_channels
FOR UPDATE TO authenticated
USING (
  agency_id IN (
    SELECT id FROM public.agencies 
    WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.agencies 
    WHERE owner_id = auth.uid()
  )
);

-- Policy for families to update their channels
CREATE POLICY chat_channels_update_family ON public.chat_channels
FOR UPDATE TO authenticated
USING (family_user_id = auth.uid())
WITH CHECK (family_user_id = auth.uid());

-- Index for faster queries
CREATE INDEX idx_chat_channels_care_match ON public.chat_channels(care_match_id);
CREATE INDEX idx_chat_channels_agency ON public.chat_channels(agency_id);
CREATE INDEX idx_chat_channels_family ON public.chat_channels(family_user_id);
CREATE INDEX idx_chat_channels_stream_id ON public.chat_channels(stream_channel_id);

-- Function to update last_message_at and message_count
CREATE OR REPLACE FUNCTION update_channel_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_channels 
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = now()
  WHERE stream_channel_id = NEW.cid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would need to be set up with StreamChat webhooks
-- For now, we'll update manually in the application
