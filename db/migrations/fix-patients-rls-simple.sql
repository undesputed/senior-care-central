-- Fix RLS policies for patients table - SIMPLE APPROACH
-- Drop all existing problematic policies first

DROP POLICY IF EXISTS patients_select_agency_matches ON public.patients;
DROP POLICY IF EXISTS families_select_agency_matches ON public.families;

-- Create a very simple policy that allows agencies to access patients
-- ONLY when they have a direct care match relationship
-- This avoids any circular references by using a direct approach

-- For patients: Allow access if there's a care match with the agency
CREATE POLICY patients_select_agency_matches ON public.patients
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.care_matches 
    WHERE patient_id = patients.id 
    AND agency_id IN (
      SELECT id 
      FROM public.agencies 
      WHERE owner_id = auth.uid()
    )
  )
);

-- For families: Allow access if there's a care match with the agency
CREATE POLICY families_select_agency_matches ON public.families
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.patients p
    JOIN public.care_matches cm ON cm.patient_id = p.id
    WHERE p.family_id = families.id 
    AND cm.agency_id IN (
      SELECT id 
      FROM public.agencies 
      WHERE owner_id = auth.uid()
    )
  )
);

-- Alternative approach: Temporarily disable RLS for testing
-- Uncomment these lines if the above still doesn't work:
-- ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.families DISABLE ROW LEVEL SECURITY;

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
WHERE tablename IN ('patients', 'families')
ORDER BY tablename, policyname;
