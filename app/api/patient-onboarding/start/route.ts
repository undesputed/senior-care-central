import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { familyName } = await request.json();

    // Get family ID
    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!family) {
      return NextResponse.json({ error: "Family profile not found" }, { status: 404 });
    }

    // Create onboarding session
    const { data: session, error } = await supabase
      .from('patient_onboarding_sessions')
      .insert({
        family_id: family.id,
        current_step: 1,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating onboarding session:', error);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error in start onboarding:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
