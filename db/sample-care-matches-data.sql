-- Sample data for care_matches table
-- Use this to manually insert test data for breakdown and tags fields

-- Sample 1: High-scoring match (92% score)
INSERT INTO public.care_matches (
  patient_id,
  agency_id,
  score,
  breakdown,
  tags
) VALUES (
  '37efdd41-60e0-4286-9e35-fcd9ac5fc869', -- Replace with actual patient ID
  'your-agency-id-here', -- Replace with actual agency ID
  92.5,
  '{
    "location": true,
    "budget": 30,
    "primaryCare": 35.2,
    "generalCare": 18.5,
    "addOns": 8.8
  }'::jsonb,
  '[
    "Good fit on budget",
    "High focus on primary care", 
    "Good support coverage",
    "Specialty service excellence",
    "Mobility support available"
  ]'::jsonb
);

-- Sample 2: Medium-scoring match (67% score)
INSERT INTO public.care_matches (
  patient_id,
  agency_id,
  score,
  breakdown,
  tags
) VALUES (
  '37efdd41-60e0-4286-9e35-fcd9ac5fc869', -- Replace with actual patient ID
  'another-agency-id-here', -- Replace with actual agency ID
  67.3,
  '{
    "location": true,
    "budget": 20,
    "primaryCare": 28.7,
    "generalCare": 15.2,
    "addOns": 3.4
  }'::jsonb,
  '[
    "May require financial flexibility",
    "Good support coverage",
    "Missing 1 required service"
  ]'::jsonb
);

-- Sample 3: Low-scoring match (45% score)
INSERT INTO public.care_matches (
  patient_id,
  agency_id,
  score,
  breakdown,
  tags
) VALUES (
  '37efdd41-60e0-4286-9e35-fcd9ac5fc869', -- Replace with actual patient ID
  'third-agency-id-here', -- Replace with actual agency ID
  45.1,
  '{
    "location": true,
    "budget": 15,
    "primaryCare": 18.3,
    "generalCare": 8.7,
    "addOns": 3.1
  }'::jsonb,
  '[
    "May require financial flexibility",
    "Missing 2 required services",
    "Limited specialty care"
  ]'::jsonb
);

-- Sample 4: Perfect match (100% score)
INSERT INTO public.care_matches (
  patient_id,
  agency_id,
  score,
  breakdown,
  tags
) VALUES (
  '37efdd41-60e0-4286-9e35-fcd9ac5fc869', -- Replace with actual patient ID
  'perfect-agency-id-here', -- Replace with actual agency ID
  100.0,
  '{
    "location": true,
    "budget": 30,
    "primaryCare": 40,
    "generalCare": 20,
    "addOns": 10
  }'::jsonb,
  '[
    "Good fit on budget",
    "High focus on primary care",
    "Good support coverage",
    "Specialty service excellence",
    "Mobility support available",
    "Perfect budget alignment",
    "All services covered"
  ]'::jsonb
);

-- Sample 5: Budget mismatch (25% score)
INSERT INTO public.care_matches (
  patient_id,
  agency_id,
  score,
  breakdown,
  tags
) VALUES (
  '37efdd41-60e0-4286-9e35-fcd9ac5fc869', -- Replace with actual patient ID
  'expensive-agency-id-here', -- Replace with actual agency ID
  25.8,
  '{
    "location": true,
    "budget": 0,
    "primaryCare": 22.1,
    "generalCare": 3.7,
    "addOns": 0
  }'::jsonb,
  '[
    "Budget significantly exceeds patient capacity",
    "Missing 3 required services",
    "Limited care coverage"
  ]'::jsonb
);

-- Breakdown field structure explanation:
-- {
--   "location": boolean,     // Always true (pre-filtered)
--   "budget": number,        // 0-30 points
--   "primaryCare": number,   // 0-40 points (support levels 3-4)
--   "generalCare": number,   // 0-20 points (support levels 1-2)
--   "addOns": number         // 0-10 points (bonuses)
-- }

-- Tags field structure explanation:
-- Array of strings describing match characteristics:
-- - "Good fit on budget" (budget = 30)
-- - "May require financial flexibility" (budget 10-20)
-- - "High focus on primary care" (primaryCare ≥ 30)
-- - "Good support coverage" (primaryCare + generalCare ≥ 45)
-- - "Specialty service excellence" (all primary services have 5 stars)
-- - "Mobility support available" (mobility services with ≥4 stars)
-- - "Missing X required services" (services not offered by agency)
-- - "Limited specialty care" (low primary care score)
-- - "Perfect budget alignment" (budget = 30)
-- - "All services covered" (no missing services)
