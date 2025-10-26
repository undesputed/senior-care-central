-- Add rating, review, and match percentage fields to agencies table
-- Run this in your Supabase SQL editor

-- Add new columns to agencies table
ALTER TABLE public.agencies 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5.00),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
ADD COLUMN IF NOT EXISTS match_percentage INTEGER DEFAULT 0 CHECK (match_percentage >= 0 AND match_percentage <= 100);

-- Add indexes for better performance on filtering
CREATE INDEX IF NOT EXISTS idx_agencies_rating ON public.agencies(average_rating);
CREATE INDEX IF NOT EXISTS idx_agencies_reviews ON public.agencies(total_reviews);
CREATE INDEX IF NOT EXISTS idx_agencies_match_percentage ON public.agencies(match_percentage);

-- Optional: Add a function to calculate match percentage based on services
-- This could be used to automatically calculate match percentages
CREATE OR REPLACE FUNCTION public.calculate_agency_match_percentage(
  agency_id_param UUID,
  required_services TEXT[]
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  agency_services_count INTEGER;
  matching_services_count INTEGER;
  match_percentage INTEGER;
BEGIN
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
    AND s.name = ANY(required_services);
  
  -- Calculate percentage (avoid division by zero)
  IF agency_services_count > 0 THEN
    match_percentage := (matching_services_count * 100) / agency_services_count;
  ELSE
    match_percentage := 0;
  END IF;
  
  RETURN match_percentage;
END;
$$;

-- Optional: Add a trigger to automatically update match percentage
-- This would update the match percentage whenever services are added/removed
CREATE OR REPLACE FUNCTION public.update_agency_match_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a placeholder - you'd need to define how to calculate match percentage
  -- For now, we'll just set a default value
  UPDATE public.agencies 
  SET match_percentage = 85 -- Default value, you can customize this logic
  WHERE id = COALESCE(NEW.agency_id, OLD.agency_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Optional: Create trigger for automatic match percentage updates
-- DROP TRIGGER IF EXISTS trg_update_match_percentage ON public.agency_services;
-- CREATE TRIGGER trg_update_match_percentage
--   AFTER INSERT OR UPDATE OR DELETE ON public.agency_services
--   FOR EACH ROW EXECUTE FUNCTION public.update_agency_match_percentage();

-- Add some sample data for testing (optional)
-- UPDATE public.agencies 
-- SET 
--   average_rating = 4.0 + (RANDOM() * 1.0),
--   total_reviews = 50 + (RANDOM() * 200)::INTEGER,
--   match_percentage = 70 + (RANDOM() * 30)::INTEGER
-- WHERE status = 'published';

COMMENT ON COLUMN public.agencies.average_rating IS 'Average rating from 0.00 to 5.00';
COMMENT ON COLUMN public.agencies.total_reviews IS 'Total number of reviews received';
COMMENT ON COLUMN public.agencies.match_percentage IS 'Match percentage for current search criteria (0-100)';
