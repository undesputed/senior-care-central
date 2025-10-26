import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    console.log('Fetching agencies from database...');
    
    // Fetch published agencies with their services and service areas
    const { data: agencies, error } = await supabase
      .from('agencies')
      .select(`
        id,
        business_name,
        description,
        phone,
        email,
        website,
        logo_url,
        cities,
        postal_codes,
        coverage_radius_km,
        permit_verified,
        average_rating,
        total_reviews,
        match_percentage,
        created_at,
        agency_services (
          service_id,
          services (
            id,
            name,
            description,
            category
          )
        ),
        agency_service_areas (
          city,
          state
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agencies:', error);
      return NextResponse.json({ error: 'Failed to fetch agencies' }, { status: 500 });
    }

    console.log('Raw agencies from database:', agencies);
    console.log('Number of agencies found:', agencies?.length || 0);

    // Transform the data to match the expected format
    const transformedAgencies = agencies?.map(agency => {
      // Get services from the joined data
      const services = agency.agency_services?.map((as: any) => as.services?.name).filter(Boolean) || [];
      
      // Get service areas
      const serviceAreas = agency.agency_service_areas?.map((area: any) => `${area.city}, ${area.state}`).join(', ') || '';
      
      // Create a mock address from cities if no specific address
      const address = serviceAreas || (agency.cities?.[0] ? `${agency.cities[0]}, WA, USA` : 'Seattle, WA, USA');
      
      // Use real data from database, with fallbacks for missing data
      const rating = agency.average_rating || 4.0;
      const reviewCount = agency.total_reviews || 0;
      const matchPercentage = agency.match_percentage || 85;
      
      // Generate price range based on services
      const hasPremiumServices = services.some((service: string) => 
        ['24-Hour Care', 'Memory Care', '24/7 Nursing Staff'].includes(service)
      );
      const priceRange = hasPremiumServices 
        ? `$${Math.floor(Math.random() * 2000) + 2000}-${Math.floor(Math.random() * 2000) + 4000}/pm`
        : `$${Math.floor(Math.random() * 800) + 500}-${Math.floor(Math.random() * 800) + 1200}/pm`;

      return {
        id: agency.id,
        name: agency.business_name || 'Unnamed Agency',
        address: address,
        priceRange: priceRange,
        rating: Math.round(rating * 10) / 10, // Round to 1 decimal
        reviewCount: reviewCount,
        matchPercentage: matchPercentage,
        specialties: services.length > 0 ? services : ['General Care', 'Companionship'],
        image: agency.logo_url || '/api/placeholder/400/200',
        isFavorited: false,
        description: agency.description,
        phone: agency.phone,
        email: agency.email,
        website: agency.website,
        permitVerified: agency.permit_verified,
        cities: agency.cities,
        coverageRadius: agency.coverage_radius_km
      };
    }) || [];

    console.log('Transformed agencies:', transformedAgencies);
    console.log('Number of transformed agencies:', transformedAgencies.length);

    return NextResponse.json({ agencies: transformedAgencies });
  } catch (error) {
    console.error('Error in agencies API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
