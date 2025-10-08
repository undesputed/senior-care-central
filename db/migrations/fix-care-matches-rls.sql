-- Fix RLS policies for care_matches table
-- Add agency access to care_matches

-- Drop existing policy
DROP POLICY IF EXISTS care_matches_rw_own_family ON public.care_matches;

-- Create separate policies for families and agencies
-- Policy for families to see their own matches
CREATE POLICY care_matches_select_family ON public.care_matches
FOR SELECT TO authenticated
USING (
  patient_id IN (
    SELECT p.id FROM public.patients p
    JOIN public.families f ON f.id = p.family_id
    WHERE f.user_id = auth.uid()
  )
);

-- Policy for agencies to see matches where they are the agency
CREATE POLICY care_matches_select_agency ON public.care_matches
FOR SELECT TO authenticated
USING (
  agency_id IN (
    SELECT id FROM public.agencies 
    WHERE owner_id = auth.uid()
  )
);

-- Policy for families to insert/update their own matches (for matching algorithm)
CREATE POLICY care_matches_insert_family ON public.care_matches
FOR INSERT TO authenticated
WITH CHECK (
  patient_id IN (
    SELECT p.id FROM public.patients p
    JOIN public.families f ON f.id = p.family_id
    WHERE f.user_id = auth.uid()
  )
);

-- Policy for agencies to insert/update matches where they are the agency
CREATE POLICY care_matches_insert_agency ON public.care_matches
FOR INSERT TO authenticated
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.agencies 
    WHERE owner_id = auth.uid()
  )
);

-- Policy for families to update their own matches
CREATE POLICY care_matches_update_family ON public.care_matches
FOR UPDATE TO authenticated
USING (
  patient_id IN (
    SELECT p.id FROM public.patients p
    JOIN public.families f ON f.id = p.family_id
    WHERE f.user_id = auth.uid()
  )
)
WITH CHECK (
  patient_id IN (
    SELECT p.id FROM public.patients p
    JOIN public.families f ON f.id = p.family_id
    WHERE f.user_id = auth.uid()
  )
);

-- Policy for agencies to update matches where they are the agency
CREATE POLICY care_matches_update_agency ON public.care_matches
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

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'care_matches'
ORDER BY policyname;
