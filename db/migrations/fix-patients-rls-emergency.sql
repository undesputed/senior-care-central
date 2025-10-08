-- EMERGENCY FIX: Simple approach to resolve infinite recursion
-- This creates the most basic policies possible

-- Drop all existing problematic policies
DROP POLICY IF EXISTS patients_select_agency_matches ON public.patients;
DROP POLICY IF EXISTS families_select_agency_matches ON public.families;

-- Option 1: Create very simple policies (try this first)
CREATE POLICY patients_select_agency_matches ON public.patients
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT patient_id 
    FROM public.care_matches 
    WHERE agency_id = (
      SELECT id 
      FROM public.agencies 
      WHERE owner_id = auth.uid()
      LIMIT 1
    )
  )
);

CREATE POLICY families_select_agency_matches ON public.families
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT p.family_id 
    FROM public.patients p
    JOIN public.care_matches cm ON cm.patient_id = p.id
    WHERE cm.agency_id = (
      SELECT id 
      FROM public.agencies 
      WHERE owner_id = auth.uid()
      LIMIT 1
    )
  )
);

-- Option 2: If the above still fails, uncomment these lines to temporarily disable RLS
-- This will allow the query to work while we figure out the proper policy
-- ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.families DISABLE ROW LEVEL SECURITY;

-- Option 3: If you want to re-enable RLS later, use these commands:
-- ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Verify the current state
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  policyname
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.tablename IN ('patients', 'families')
ORDER BY t.tablename, p.policyname;
