-- Fix RLS policies for patients table to allow agencies to access patient data
-- when they have a care match with that patient

-- First, drop any existing problematic policies
DROP POLICY IF EXISTS patients_select_agency_matches ON public.patients;
DROP POLICY IF EXISTS families_select_agency_matches ON public.families;

-- Create a simpler policy for agencies to access patients through care_matches
-- This avoids infinite recursion by using a direct join approach
CREATE POLICY patients_select_agency_matches ON public.patients
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.care_matches cm
    JOIN public.agencies a ON a.id = cm.agency_id
    WHERE cm.patient_id = patients.id 
    AND a.owner_id = auth.uid()
  )
);

-- Create a simpler policy for families table
CREATE POLICY families_select_agency_matches ON public.families
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    JOIN public.care_matches cm ON cm.patient_id = p.id
    JOIN public.agencies a ON a.id = cm.agency_id
    WHERE p.family_id = families.id 
    AND a.owner_id = auth.uid()
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
WHERE tablename IN ('patients', 'families')
ORDER BY tablename, policyname;
