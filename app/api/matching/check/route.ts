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

    // Check if matches exist for this patient
    const { count } = await supabase
      .from('care_matches')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    return NextResponse.json({
      hasMatches: (count || 0) > 0,
      matchCount: count || 0
    });

  } catch (error) {
    console.error('Error checking matches:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
