-- Complete reviews and ratings system for agencies
-- Run this in your Supabase SQL editor

-- 1. Add basic metrics to agencies table
ALTER TABLE public.agencies 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5.00),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
ADD COLUMN IF NOT EXISTS match_percentage INTEGER DEFAULT 0 CHECK (match_percentage >= 0 AND match_percentage <= 100);

-- 2. Create reviews table for detailed feedback
CREATE TABLE IF NOT EXISTS public.agency_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  
  -- Review categories (optional detailed ratings)
  care_quality INTEGER CHECK (care_quality >= 1 AND care_quality <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  reliability INTEGER CHECK (reliability >= 1 AND reliability <= 5),
  value_for_money INTEGER CHECK (value_for_money >= 1 AND value_for_money <= 5),
  
  -- Metadata
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  response_from_agency TEXT,
  response_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one review per family per agency
  UNIQUE(agency_id, family_id)
);

-- Enable RLS
ALTER TABLE public.agency_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Families can read all public reviews
CREATE POLICY agency_reviews_select_public ON public.agency_reviews
FOR SELECT TO authenticated
USING (is_public = TRUE);

-- Families can read their own reviews
CREATE POLICY agency_reviews_select_own ON public.agency_reviews
FOR SELECT TO authenticated
USING (family_id IN (
  SELECT id FROM public.families WHERE user_id = auth.uid()
));

-- Families can insert their own reviews
CREATE POLICY agency_reviews_insert_own ON public.agency_reviews
FOR INSERT TO authenticated
WITH CHECK (family_id IN (
  SELECT id FROM public.families WHERE user_id = auth.uid()
));

-- Families can update their own reviews
CREATE POLICY agency_reviews_update_own ON public.agency_reviews
FOR UPDATE TO authenticated
USING (family_id IN (
  SELECT id FROM public.families WHERE user_id = auth.uid()
))
WITH CHECK (family_id IN (
  SELECT id FROM public.families WHERE user_id = auth.uid()
));

-- Agencies can read reviews for their agency
CREATE POLICY agency_reviews_select_agency ON public.agency_reviews
FOR SELECT TO authenticated
USING (agency_id IN (
  SELECT id FROM public.agencies WHERE owner_id = auth.uid()
));

-- Agencies can respond to reviews
CREATE POLICY agency_reviews_update_agency ON public.agency_reviews
FOR UPDATE TO authenticated
USING (agency_id IN (
  SELECT id FROM public.agencies WHERE owner_id = auth.uid()
))
WITH CHECK (agency_id IN (
  SELECT id FROM public.agencies WHERE owner_id = auth.uid()
));

-- 3. Function to update agency rating when reviews change
CREATE OR REPLACE FUNCTION public.update_agency_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_avg_rating DECIMAL(3,2);
  new_total_reviews INTEGER;
BEGIN
  -- Calculate new average rating and total reviews
  SELECT 
    COALESCE(AVG(rating), 0.00),
    COUNT(*)
  INTO new_avg_rating, new_total_reviews
  FROM public.agency_reviews
  WHERE agency_id = COALESCE(NEW.agency_id, OLD.agency_id)
    AND is_public = TRUE;
  
  -- Update the agency record
  UPDATE public.agencies
  SET 
    average_rating = new_avg_rating,
    total_reviews = new_total_reviews,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.agency_id, OLD.agency_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Trigger to automatically update agency ratings
DROP TRIGGER IF EXISTS trg_update_agency_rating ON public.agency_reviews;
CREATE TRIGGER trg_update_agency_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_agency_rating();

-- 5. Function to calculate match percentage based on patient needs
CREATE OR REPLACE FUNCTION public.calculate_agency_match_percentage(
  agency_id_param UUID,
  patient_id_param UUID DEFAULT NULL,
  required_services TEXT[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  agency_services_count INTEGER;
  matching_services_count INTEGER;
  match_percentage INTEGER;
  services_to_match TEXT[];
BEGIN
  -- If patient_id is provided, get their required services
  IF patient_id_param IS NOT NULL THEN
    SELECT ARRAY_AGG(s.name)
    INTO services_to_match
    FROM public.patient_service_requirements psr
    JOIN public.services s ON psr.service_id = s.id
    WHERE psr.patient_id = patient_id_param;
  ELSE
    -- Use provided required_services array
    services_to_match := COALESCE(required_services, ARRAY[]::TEXT[]);
  END IF;
  
  -- Count total services offered by the agency
  SELECT COUNT(*)
  INTO agency_services_count
  FROM public.agency_services ags
  JOIN public.services s ON ags.service_id = s.id
  WHERE ags.agency_id = agency_id_param;
  
  -- Count how many required services the agency offers
  SELECT COUNT(*)
  INTO matching_services_count
  FROM public.agency_services ags
  JOIN public.services s ON ags.service_id = s.id
  WHERE ags.agency_id = agency_id_param
    AND s.name = ANY(services_to_match);
  
  -- Calculate percentage (avoid division by zero)
  IF array_length(services_to_match, 1) > 0 THEN
    match_percentage := (matching_services_count * 100) / array_length(services_to_match, 1);
  ELSE
    match_percentage := 85; -- Default high match if no specific requirements
  END IF;
  
  -- Ensure percentage is within bounds
  match_percentage := GREATEST(0, LEAST(100, match_percentage));
  
  RETURN match_percentage;
END;
$$;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agencies_rating ON public.agencies(average_rating);
CREATE INDEX IF NOT EXISTS idx_agencies_reviews ON public.agencies(total_reviews);
CREATE INDEX IF NOT EXISTS idx_agencies_match_percentage ON public.agencies(match_percentage);
CREATE INDEX IF NOT EXISTS idx_agency_reviews_agency_id ON public.agency_reviews(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_reviews_family_id ON public.agency_reviews(family_id);
CREATE INDEX IF NOT EXISTS idx_agency_reviews_rating ON public.agency_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_agency_reviews_created_at ON public.agency_reviews(created_at);

-- 7. Add some sample data for testing (optional)
-- Uncomment these lines to add sample reviews for testing
/*
INSERT INTO public.agency_reviews (agency_id, family_id, rating, title, comment, care_quality, communication, reliability, value_for_money)
SELECT 
  a.id,
  f.id,
  (4 + (RANDOM() * 1))::INTEGER, -- Rating between 4-5
  CASE (RANDOM() * 4)::INTEGER
    WHEN 0 THEN 'Excellent Care'
    WHEN 1 THEN 'Very Professional'
    WHEN 2 THEN 'Highly Recommended'
    ELSE 'Great Service'
  END,
  'Sample review comment for testing purposes.',
  (4 + (RANDOM() * 1))::INTEGER,
  (4 + (RANDOM() * 1))::INTEGER,
  (4 + (RANDOM() * 1))::INTEGER,
  (4 + (RANDOM() * 1))::INTEGER
FROM public.agencies a
CROSS JOIN public.families f
WHERE a.status = 'published'
LIMIT 10;
*/

-- 8. Add comments for documentation
COMMENT ON COLUMN public.agencies.average_rating IS 'Average rating from 0.00 to 5.00, calculated from public reviews';
COMMENT ON COLUMN public.agencies.total_reviews IS 'Total number of public reviews received';
COMMENT ON COLUMN public.agencies.match_percentage IS 'Match percentage for current search criteria (0-100)';

COMMENT ON TABLE public.agency_reviews IS 'Reviews and ratings for agencies from families';
COMMENT ON COLUMN public.agency_reviews.rating IS 'Overall rating from 1-5 stars';
COMMENT ON COLUMN public.agency_reviews.care_quality IS 'Rating for quality of care provided (1-5)';
COMMENT ON COLUMN public.agency_reviews.communication IS 'Rating for communication quality (1-5)';
COMMENT ON COLUMN public.agency_reviews.reliability IS 'Rating for reliability and punctuality (1-5)';
COMMENT ON COLUMN public.agency_reviews.value_for_money IS 'Rating for value for money (1-5)';
