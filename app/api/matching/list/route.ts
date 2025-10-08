import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    }

    // Verify patient belongs to current user
    const { data: patient } = await supabase
      .from('patients')
      .select(`
        id,
        family_id,
        families!inner(user_id)
      `)
      .eq('id', patientId)
      .eq('families.user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get matches with agency details
    const { data: matches, error } = await supabase
      .from('care_matches')
      .select(`
        id,
        score,
        breakdown,
        tags,
        created_at,
        agencies!inner(
          id,
          business_name,
          description,
          phone,
          email,
          website,
          logo_url
        )
      `)
      .eq('patient_id', patientId)
      .order('score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching matches:', error);
      return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('care_matches')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    // Format matches with normalized display
    const formattedMatches = matches?.map(match => {
      const normalizedScore = getNormalizedScore(match.score);
      const topTags = getTopTags(match.tags, 5);
      const agency = match.agencies as any;

      return {
        id: match.id,
        agencyId: agency.id,
        agencyName: agency.business_name,
        agencyDescription: agency.description,
        agencyPhone: agency.phone,
        agencyEmail: agency.email,
        agencyWebsite: agency.website,
        agencyLogo: agency.logo_url,
        score: match.score,
        normalizedScore,
        breakdown: match.breakdown,
        tags: topTags,
        createdAt: match.created_at
      };
    }) || [];

    return NextResponse.json({
      matches: formattedMatches,
      pagination: {
        offset,
        limit,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error) {
    console.error('Error in list matches:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getNormalizedScore(score: number): { label: string; stars: string; color: string } {
  if (score >= 85) {
    return { label: "Strong Match", stars: "⭐⭐⭐⭐", color: "green" };
  } else if (score >= 70) {
    return { label: "Good Match", stars: "⭐⭐⭐", color: "blue" };
  } else if (score >= 60) {
    return { label: "Match", stars: "⭐⭐", color: "yellow" };
  } else {
    return { label: "Consider", stars: "⭐", color: "gray" };
  }
}

function getTopTags(tags: string[], limit: number): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.slice(0, limit);
}
