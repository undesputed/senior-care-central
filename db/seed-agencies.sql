-- Seed dummy agency data for testing onboarding and matching processes
-- This script inserts realistic agency data with all required relationships

-- Insert agencies
INSERT INTO public.agencies (
  id, 
  owner_id, 
  business_name, 
  business_registration_number, 
  year_established,
  website, 
  logo_url, 
  phone, 
  email, 
  admin_contact_name,
  cities,
  postal_codes,
  coverage_radius_km,
  description, 
  permit_verified, 
  status, 
  created_at, 
  updated_at
) VALUES 
-- Agency 1: Concierge Care Advisors
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1), -- Use first user as agency owner
  'Concierge Care Advisors',
  'WA-HC-2024-001',
  2015,
  'https://conciergecare.com',
  'https://example.com/logo1.jpg',
  '(206) 555-0101',
  'info@conciergecare.com',
  'John Smith',
  ARRAY['Seattle', 'Bellevue'],
  ARRAY['98121', '98004'],
  25,
  'Professional in-home care services specializing in senior care, dementia support, and post-surgery recovery.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Agency 2: Robert's Senior Care
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Robert''s Senior Care',
  'WA-AL-2024-002',
  2018,
  'https://robertscare.com',
  'https://example.com/logo2.jpg',
  '(206) 555-0102',
  'contact@robertscare.com',
  'Robert Johnson',
  ARRAY['Seattle', 'Tacoma'],
  ARRAY['98101', '98401'],
  30,
  'Comprehensive senior living community offering independent living, assisted living, and memory care services.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Agency 3: Elderly Home
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Elderly Home',
  'WA-NH-2024-003',
  2012,
  'https://elderlyhome.com',
  'https://example.com/logo3.jpg',
  '(206) 555-0103',
  'info@elderlyhome.com',
  'Mary Davis',
  ARRAY['Seattle'],
  ARRAY['98102'],
  20,
  'Skilled nursing facility providing 24/7 medical care, rehabilitation services, and long-term care.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Agency 4: Harmony House
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Harmony House',
  'WA-HC-2024-004',
  2020,
  'https://harmonyhouse.com',
  'https://example.com/logo4.jpg',
  '(206) 555-0104',
  'care@harmonyhouse.com',
  'Sarah Wilson',
  ARRAY['Seattle', 'Bellevue'],
  ARRAY['98103', '98004'],
  25,
  'Specialized care for seniors with dementia, Alzheimer''s, and memory care needs in the comfort of their own home.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Agency 5: Serenity Senior Living
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Serenity Senior Living',
  'WA-AL-2024-005',
  2016,
  'https://serenitysenior.com',
  'https://example.com/logo5.jpg',
  '(206) 555-0105',
  'info@serenitysenior.com',
  'Michael Brown',
  ARRAY['Seattle'],
  ARRAY['98104'],
  15,
  'Luxury assisted living community with premium amenities, gourmet dining, and personalized care plans.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Agency 6: Tranquil Gardens
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Tranquil Gardens',
  'WA-NH-2024-006',
  2019,
  'https://tranquilgardens.com',
  'https://example.com/logo6.jpg',
  '(206) 555-0106',
  'contact@tranquilgardens.com',
  'Jennifer Lee',
  ARRAY['Seattle', 'Tacoma'],
  ARRAY['98105', '98401'],
  35,
  'Peaceful nursing home environment with beautiful gardens, providing compassionate end-of-life care.',
  true,
  'published',
  NOW(),
  NOW()
);

-- Get agency IDs for service relationships
WITH agency_data AS (
  SELECT 
    id,
    business_name,
    CASE 
      WHEN business_name = 'Concierge Care Advisors' THEN 1
      WHEN business_name = 'Robert''s Senior Care' THEN 2
      WHEN business_name = 'Elderly Home' THEN 3
      WHEN business_name = 'Harmony House' THEN 4
      WHEN business_name = 'Serenity Senior Living' THEN 5
      WHEN business_name = 'Tranquil Gardens' THEN 6
    END as agency_num
  FROM public.agencies 
  WHERE business_name IN (
    'Concierge Care Advisors', 
    'Robert''s Senior Care', 
    'Elderly Home',
    'Harmony House',
    'Serenity Senior Living',
    'Tranquil Gardens'
  )
),
service_data AS (
  SELECT id, name FROM public.services
)
-- Insert agency service strengths (distributing 20 stars per agency)
INSERT INTO public.agency_service_strengths (agency_id, service_id, points)
SELECT 
  a.id,
  s.id,
  CASE 
    WHEN a.agency_num = 1 THEN -- Concierge Care Advisors
      CASE s.name
        WHEN 'Personal Care' THEN 5
        WHEN 'Medication Management' THEN 4
        WHEN 'Companionship' THEN 3
        WHEN 'Meal Preparation' THEN 3
        WHEN 'Transportation' THEN 2
        WHEN 'Housekeeping' THEN 2
        WHEN 'Memory Care' THEN 1
        ELSE 0
      END
    WHEN a.agency_num = 2 THEN -- Robert's Senior Care
      CASE s.name
        WHEN 'Personal Care' THEN 4
        WHEN 'Medication Management' THEN 4
        WHEN 'Companionship' THEN 4
        WHEN 'Meal Preparation' THEN 3
        WHEN 'Transportation' THEN 2
        WHEN 'Housekeeping' THEN 2
        WHEN 'Memory Care' THEN 1
        ELSE 0
      END
    WHEN a.agency_num = 3 THEN -- Elderly Home
      CASE s.name
        WHEN 'Personal Care' THEN 3
        WHEN 'Medication Management' THEN 5
        WHEN 'Companionship' THEN 2
        WHEN 'Meal Preparation' THEN 2
        WHEN 'Transportation' THEN 1
        WHEN 'Housekeeping' THEN 3
        WHEN 'Memory Care' THEN 4
        ELSE 0
      END
    WHEN a.agency_num = 4 THEN -- Harmony House
      CASE s.name
        WHEN 'Personal Care' THEN 3
        WHEN 'Medication Management' THEN 3
        WHEN 'Companionship' THEN 4
        WHEN 'Meal Preparation' THEN 2
        WHEN 'Transportation' THEN 2
        WHEN 'Housekeeping' THEN 2
        WHEN 'Memory Care' THEN 4
        ELSE 0
      END
    WHEN a.agency_num = 5 THEN -- Serenity Senior Living
      CASE s.name
        WHEN 'Personal Care' THEN 4
        WHEN 'Medication Management' THEN 3
        WHEN 'Companionship' THEN 5
        WHEN 'Meal Preparation' THEN 4
        WHEN 'Transportation' THEN 2
        WHEN 'Housekeeping' THEN 2
        WHEN 'Memory Care' THEN 0
        ELSE 0
      END
    WHEN a.agency_num = 6 THEN -- Tranquil Gardens
      CASE s.name
        WHEN 'Personal Care' THEN 2
        WHEN 'Medication Management' THEN 4
        WHEN 'Companionship' THEN 3
        WHEN 'Meal Preparation' THEN 2
        WHEN 'Transportation' THEN 1
        WHEN 'Housekeeping' THEN 3
        WHEN 'Memory Care' THEN 5
        ELSE 0
      END
  END
FROM agency_data a
CROSS JOIN service_data s
WHERE CASE 
  WHEN a.agency_num = 1 THEN -- Concierge Care Advisors
    CASE s.name
      WHEN 'Personal Care' THEN 5
      WHEN 'Medication Management' THEN 4
      WHEN 'Companionship' THEN 3
      WHEN 'Meal Preparation' THEN 3
      WHEN 'Transportation' THEN 2
      WHEN 'Housekeeping' THEN 2
      WHEN 'Memory Care' THEN 1
      ELSE 0
    END
  WHEN a.agency_num = 2 THEN -- Robert's Senior Care
    CASE s.name
      WHEN 'Personal Care' THEN 4
      WHEN 'Medication Management' THEN 4
      WHEN 'Companionship' THEN 4
      WHEN 'Meal Preparation' THEN 3
      WHEN 'Transportation' THEN 2
      WHEN 'Housekeeping' THEN 2
      WHEN 'Memory Care' THEN 1
      ELSE 0
    END
  WHEN a.agency_num = 3 THEN -- Elderly Home
    CASE s.name
      WHEN 'Personal Care' THEN 3
      WHEN 'Medication Management' THEN 5
      WHEN 'Companionship' THEN 2
      WHEN 'Meal Preparation' THEN 2
      WHEN 'Transportation' THEN 1
      WHEN 'Housekeeping' THEN 3
      WHEN 'Memory Care' THEN 4
      ELSE 0
    END
  WHEN a.agency_num = 4 THEN -- Harmony House
    CASE s.name
      WHEN 'Personal Care' THEN 3
      WHEN 'Medication Management' THEN 3
      WHEN 'Companionship' THEN 4
      WHEN 'Meal Preparation' THEN 2
      WHEN 'Transportation' THEN 2
      WHEN 'Housekeeping' THEN 2
      WHEN 'Memory Care' THEN 4
      ELSE 0
    END
  WHEN a.agency_num = 5 THEN -- Serenity Senior Living
    CASE s.name
      WHEN 'Personal Care' THEN 4
      WHEN 'Medication Management' THEN 3
      WHEN 'Companionship' THEN 5
      WHEN 'Meal Preparation' THEN 4
      WHEN 'Transportation' THEN 2
      WHEN 'Housekeeping' THEN 2
      WHEN 'Memory Care' THEN 0
      ELSE 0
    END
  WHEN a.agency_num = 6 THEN -- Tranquil Gardens
    CASE s.name
      WHEN 'Personal Care' THEN 2
      WHEN 'Medication Management' THEN 4
      WHEN 'Companionship' THEN 3
      WHEN 'Meal Preparation' THEN 2
      WHEN 'Transportation' THEN 1
      WHEN 'Housekeeping' THEN 3
      WHEN 'Memory Care' THEN 5
      ELSE 0
    END
END > 0;

-- Insert agency service rates for budget matching
-- We'll add rates for Personal Care service as a baseline monthly rate
INSERT INTO public.agency_service_rates (agency_id, service_id, pricing_format, currency, min_amount, max_amount)
SELECT 
  a.id,
  s.id,
  'monthly',
  'USD',
  CASE a.business_name
    WHEN 'Concierge Care Advisors' THEN 1000
    WHEN 'Robert''s Senior Care' THEN 1200
    WHEN 'Elderly Home' THEN 1500
    WHEN 'Harmony House' THEN 1100
    WHEN 'Serenity Senior Living' THEN 1800
    WHEN 'Tranquil Gardens' THEN 1400
  END,
  CASE a.business_name
    WHEN 'Concierge Care Advisors' THEN 1200
    WHEN 'Robert''s Senior Care' THEN 1400
    WHEN 'Elderly Home' THEN 1700
    WHEN 'Harmony House' THEN 1300
    WHEN 'Serenity Senior Living' THEN 2000
    WHEN 'Tranquil Gardens' THEN 1600
  END
FROM public.agencies a
CROSS JOIN public.services s
WHERE a.business_name IN (
  'Concierge Care Advisors', 
  'Robert''s Senior Care', 
  'Elderly Home',
  'Harmony House',
  'Serenity Senior Living',
  'Tranquil Gardens'
)
AND s.name = 'Personal Care';

-- First, reduce existing points to make room for new services
-- Reduce some existing services by 2 points total to stay at 20

UPDATE public.agency_service_strengths 
SET points = points - 1
WHERE agency_id IN (
  SELECT id FROM public.agencies 
  WHERE business_name IN (
    'Concierge Care Advisors', 
    'Robert''s Senior Care', 
    'Elderly Home',
    'Harmony House',
    'Serenity Senior Living',
    'Tranquil Gardens'
  )
)
AND service_id IN (
  SELECT id FROM public.services 
  WHERE name IN ('Personal Care', 'Medication Management')
)
AND points > 1;

-- Now add the new services with minimal points
INSERT INTO public.agency_service_strengths (agency_id, service_id, points)
SELECT 
  a.id,
  s.id,
  1 -- Just 1 point each to stay within limit
FROM public.agencies a
CROSS JOIN public.services s
WHERE a.business_name IN (
  'Concierge Care Advisors', 
  'Robert''s Senior Care', 
  'Elderly Home',
  'Harmony House',
  'Serenity Senior Living',
  'Tranquil Gardens'
)
AND s.slug IN ('mobility-assistance', 'exercise-therapy')
-- Only insert if the combination doesn't already exist
AND NOT EXISTS (
  SELECT 1 FROM public.agency_service_strengths ass 
  WHERE ass.agency_id = a.id AND ass.service_id = s.id
);

-- Insert agency service areas (cities/states they serve)
INSERT INTO public.agency_service_areas (agency_id, city, state, created_at)
SELECT 
  a.id,
  'Seattle',
  'WA',
  NOW()
FROM public.agencies a
WHERE a.business_name IN (
  'Concierge Care Advisors', 
  'Robert''s Senior Care', 
  'Elderly Home',
  'Harmony House',
  'Serenity Senior Living',
  'Tranquil Gardens'
);

-- Also add some agencies serving other cities for variety
INSERT INTO public.agency_service_areas (agency_id, city, state, created_at)
SELECT 
  a.id,
  'Bellevue',
  'WA',
  NOW()
FROM public.agencies a
WHERE a.business_name IN ('Concierge Care Advisors', 'Harmony House');

INSERT INTO public.agency_service_areas (agency_id, city, state, created_at)
SELECT 
  a.id,
  'Tacoma',
  'WA',
  NOW()
FROM public.agencies a
WHERE a.business_name IN ('Robert''s Senior Care', 'Tranquil Gardens');

-- ========================================
-- ADDITIONAL DIVERSE AGENCIES FOR COMPREHENSIVE TESTING
-- ========================================

-- Add more agencies with different characteristics
INSERT INTO public.agencies (
  id, 
  owner_id,
  business_name, 
  business_registration_number, 
  year_established,
  website, 
  logo_url, 
  phone, 
  email, 
  admin_contact_name,
  cities,
  postal_codes,
  coverage_radius_km,
  description, 
  permit_verified, 
  status, 
  created_at, 
  updated_at
) VALUES 
-- High-End Premium Agency (High Budget, All 5-Star Services)
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Elite Senior Care Solutions',
  'WA-HC-2024-007',
  2010,
  'https://eliteseniorcare.com',
  'https://example.com/logo7.jpg',
  '(206) 555-0700',
  'info@eliteseniorcare.com',
  'Sarah Johnson',
  ARRAY['Seattle', 'Bellevue', 'Redmond'],
  ARRAY['98101', '98004', '98052'],
  30,
  'Premium in-home care with 24/7 nursing staff, specializing in complex medical conditions and luxury care services.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Budget-Friendly Agency (Low Budget, Basic Services)
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Affordable Care Partners',
  'WA-HC-2024-008',
  2018,
  'https://affordablecare.com',
  'https://example.com/logo8.jpg',
  '(206) 555-0800',
  'info@affordablecare.com',
  'Mike Chen',
  ARRAY['Tacoma', 'Federal Way'],
  ARRAY['98401', '98003'],
  20,
  'Cost-effective care solutions for families on a budget, focusing on essential daily living assistance.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Specialized Memory Care Agency (High Memory Care, Low Other Services)
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Memory Care Specialists',
  'WA-HC-2024-009',
  2012,
  'https://memorycarespecialists.com',
  'https://example.com/logo9.jpg',
  '(206) 555-0900',
  'info@memorycarespecialists.com',
  'Dr. Emily Rodriguez',
  ARRAY['Seattle', 'Kirkland'],
  ARRAY['98115', '98033'],
  25,
  'Specialized dementia and Alzheimer''s care with certified memory care specialists and family support programs.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Mobility & Physical Therapy Focus (High Mobility/Exercise, Low Memory Care)
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Mobility First Care',
  'WA-HC-2024-010',
  2016,
  'https://mobilityfirst.com',
  'https://example.com/logo10.jpg',
  '(206) 555-1000',
  'info@mobilityfirst.com',
  'James Wilson',
  ARRAY['Seattle', 'Bothell'],
  ARRAY['98103', '98011'],
  22,
  'Physical therapy and mobility assistance specialists, helping seniors maintain independence through movement and exercise.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Comprehensive Care Agency (Balanced Services, Medium Budget)
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Complete Care Solutions',
  'WA-HC-2024-011',
  2014,
  'https://completecare.com',
  'https://example.com/logo11.jpg',
  '(206) 555-1100',
  'info@completecare.com',
  'Lisa Thompson',
  ARRAY['Seattle', 'Renton', 'Kent'],
  ARRAY['98122', '98055', '98032'],
  28,
  'Full-spectrum care services from basic assistance to complex medical needs, serving diverse communities.',
  true,
  'published',
  NOW(),
  NOW()
),
-- Rural/Remote Care Agency (Limited Location, Basic Services)
(
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'Rural Care Network',
  'WA-HC-2024-012',
  2020,
  'https://ruralcare.com',
  'https://example.com/logo12.jpg',
  '(360) 555-1200',
  'info@ruralcare.com',
  'Tom Anderson',
  ARRAY['Spokane', 'Yakima'],
  ARRAY['99201', '98901'],
  50,
  'Serving rural communities with essential care services, focusing on transportation and basic daily assistance.',
  true,
  'published',
  NOW(),
  NOW()
);

-- Add service strengths for new agencies with diverse patterns
-- Reset existing strengths for these agencies to avoid exceeding 20 total
DELETE FROM public.agency_service_strengths
WHERE agency_id IN (
  SELECT id FROM public.agencies WHERE business_name IN (
    'Elite Senior Care Solutions',
    'Affordable Care Partners', 
    'Memory Care Specialists',
    'Mobility First Care',
    'Complete Care Solutions',
    'Rural Care Network'
  )
);

-- Insert fixed allocations that sum to exactly 20 points per agency
INSERT INTO public.agency_service_strengths (agency_id, service_id, points)
-- Elite Senior Care Solutions: 5+5+4+3+3 = 20
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Elite Senior Care Solutions'), (SELECT id FROM public.services WHERE slug = 'personal-care'), 5 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Elite Senior Care Solutions'), (SELECT id FROM public.services WHERE slug = 'medication-management'), 5 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Elite Senior Care Solutions'), (SELECT id FROM public.services WHERE slug = 'mobility-assistance'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Elite Senior Care Solutions'), (SELECT id FROM public.services WHERE slug = 'bathing-dressing'), 3 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Elite Senior Care Solutions'), (SELECT id FROM public.services WHERE slug = 'memory-care'), 3 UNION ALL
-- Affordable Care Partners: 4+4+4+3+3+2 = 20
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Affordable Care Partners'), (SELECT id FROM public.services WHERE slug = 'personal-care'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Affordable Care Partners'), (SELECT id FROM public.services WHERE slug = 'housekeeping'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Affordable Care Partners'), (SELECT id FROM public.services WHERE slug = 'meal-preparation'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Affordable Care Partners'), (SELECT id FROM public.services WHERE slug = 'laundry'), 3 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Affordable Care Partners'), (SELECT id FROM public.services WHERE slug = 'companionship'), 3 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Affordable Care Partners'), (SELECT id FROM public.services WHERE slug = 'transportation'), 2 UNION ALL
-- Memory Care Specialists: 5+5+4+3+3 = 20
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Memory Care Specialists'), (SELECT id FROM public.services WHERE slug = 'memory-care'), 5 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Memory Care Specialists'), (SELECT id FROM public.services WHERE slug = 'medication-management'), 5 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Memory Care Specialists'), (SELECT id FROM public.services WHERE slug = 'personal-care'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Memory Care Specialists'), (SELECT id FROM public.services WHERE slug = 'bathing-dressing'), 3 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Memory Care Specialists'), (SELECT id FROM public.services WHERE slug = 'companionship'), 3 UNION ALL
-- Mobility First Care: 5+5+4+3+3 = 20
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Mobility First Care'), (SELECT id FROM public.services WHERE slug = 'mobility-assistance'), 5 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Mobility First Care'), (SELECT id FROM public.services WHERE slug = 'exercise-therapy'), 5 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Mobility First Care'), (SELECT id FROM public.services WHERE slug = 'bathing-dressing'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Mobility First Care'), (SELECT id FROM public.services WHERE slug = 'personal-care'), 3 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Mobility First Care'), (SELECT id FROM public.services WHERE slug = 'transportation'), 3 UNION ALL
-- Complete Care Solutions: 4+4+4+3+3+2 = 20
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Complete Care Solutions'), (SELECT id FROM public.services WHERE slug = 'personal-care'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Complete Care Solutions'), (SELECT id FROM public.services WHERE slug = 'medication-management'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Complete Care Solutions'), (SELECT id FROM public.services WHERE slug = 'mobility-assistance'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Complete Care Solutions'), (SELECT id FROM public.services WHERE slug = 'bathing-dressing'), 3 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Complete Care Solutions'), (SELECT id FROM public.services WHERE slug = 'memory-care'), 3 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Complete Care Solutions'), (SELECT id FROM public.services WHERE slug = 'transportation'), 2 UNION ALL
-- Rural Care Network: 5+4+4+3+2+2 = 20
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Rural Care Network'), (SELECT id FROM public.services WHERE slug = 'transportation'), 5 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Rural Care Network'), (SELECT id FROM public.services WHERE slug = 'personal-care'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Rural Care Network'), (SELECT id FROM public.services WHERE slug = 'housekeeping'), 4 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Rural Care Network'), (SELECT id FROM public.services WHERE slug = 'meal-preparation'), 3 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Rural Care Network'), (SELECT id FROM public.services WHERE slug = 'laundry'), 2 UNION ALL
SELECT (SELECT id FROM public.agencies WHERE business_name = 'Rural Care Network'), (SELECT id FROM public.services WHERE slug = 'companionship'), 2;


-- Add service rates for new agencies with different pricing tiers
INSERT INTO public.agency_service_rates (agency_id, service_id, pricing_format, currency, min_amount, max_amount)
SELECT 
  a.id,
  s.id,
  'monthly',
  'USD',
  CASE a.business_name
    WHEN 'Elite Senior Care Solutions' THEN 3000
    WHEN 'Affordable Care Partners' THEN 800
    WHEN 'Memory Care Specialists' THEN 2000
    WHEN 'Mobility First Care' THEN 1500
    WHEN 'Complete Care Solutions' THEN 1800
    WHEN 'Rural Care Network' THEN 1200
  END,
  CASE a.business_name
    WHEN 'Elite Senior Care Solutions' THEN 5000
    WHEN 'Affordable Care Partners' THEN 1200
    WHEN 'Memory Care Specialists' THEN 2800
    WHEN 'Mobility First Care' THEN 2200
    WHEN 'Complete Care Solutions' THEN 2500
    WHEN 'Rural Care Network' THEN 1800
  END
FROM public.agencies a
CROSS JOIN public.services s
WHERE a.business_name IN (
  'Elite Senior Care Solutions',
  'Affordable Care Partners', 
  'Memory Care Specialists',
  'Mobility First Care',
  'Complete Care Solutions',
  'Rural Care Network'
)
AND s.slug IN ('personal-care', 'medication-management', 'mobility-assistance', 'bathing-dressing', 'memory-care', 'exercise-therapy');

-- Add service areas for new agencies
INSERT INTO public.agency_service_areas (agency_id, city, state, created_at)
SELECT 
  a.id,
  'Seattle',
  'WA',
  NOW()
FROM public.agencies a
WHERE a.business_name IN (
  'Elite Senior Care Solutions',
  'Memory Care Specialists',
  'Mobility First Care',
  'Complete Care Solutions'
);

INSERT INTO public.agency_service_areas (agency_id, city, state, created_at)
SELECT 
  a.id,
  'Bellevue',
  'WA',
  NOW()
FROM public.agencies a
WHERE a.business_name IN ('Elite Senior Care Solutions', 'Complete Care Solutions');

INSERT INTO public.agency_service_areas (agency_id, city, state, created_at)
SELECT 
  a.id,
  'Tacoma',
  'WA',
  NOW()
FROM public.agencies a
WHERE a.business_name IN ('Affordable Care Partners', 'Complete Care Solutions');

INSERT INTO public.agency_service_areas (agency_id, city, state, created_at)
SELECT 
  a.id,
  'Spokane',
  'WA',
  NOW()
FROM public.agencies a
WHERE a.business_name = 'Rural Care Network';

INSERT INTO public.agency_service_areas (agency_id, city, state, created_at)
SELECT 
  a.id,
  'Yakima',
  'WA',
  NOW()
FROM public.agencies a
WHERE a.business_name = 'Rural Care Network';
