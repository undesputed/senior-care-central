import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    console.log('=== DEBUG: Checking agency data ===');
    
    // Check all agencies (regardless of status)
    const { data: allAgencies, error: allError } = await supabase
      .from('agencies')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('All agencies (any status):', allAgencies);
    console.log('All agencies count:', allAgencies?.length || 0);
    
    if (allError) {
      console.error('Error fetching all agencies:', allError);
    }
    
    // Check published agencies only
    const { data: publishedAgencies, error: publishedError } = await supabase
      .from('agencies')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    console.log('Published agencies:', publishedAgencies);
    console.log('Published agencies count:', publishedAgencies?.length || 0);
    
    if (publishedError) {
      console.error('Error fetching published agencies:', publishedError);
    }
    
    // Check agency services
    const { data: agencyServices, error: servicesError } = await supabase
      .from('agency_services')
      .select(`
        agency_id,
        services (
          name,
          description
        )
      `);
    
    console.log('Agency services:', agencyServices);
    console.log('Agency services count:', agencyServices?.length || 0);
    
    if (servicesError) {
      console.error('Error fetching agency services:', servicesError);
    }
    
    return NextResponse.json({
      debug: true,
      allAgencies: allAgencies || [],
      publishedAgencies: publishedAgencies || [],
      agencyServices: agencyServices || [],
      counts: {
        all: allAgencies?.length || 0,
        published: publishedAgencies?.length || 0,
        services: agencyServices?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
