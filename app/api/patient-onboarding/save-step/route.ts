import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { step, data } = await request.json();

    // Get family ID
    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!family) {
      return NextResponse.json({ error: "Family profile not found" }, { status: 404 });
    }

    // Get current session
    const { data: session } = await supabase
      .from('patient_onboarding_sessions')
      .select('id, current_step, patient_id')
      .eq('family_id', family.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return NextResponse.json({ error: "No active session found" }, { status: 404 });
    }

    // Update session step
    const { error: updateError } = await supabase
      .from('patient_onboarding_sessions')
      .update({ 
        current_step: step,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }

    // Handle step-specific data saving
    if (step === 1) {
      // Save basic patient info
      // If the session already has a patient_id, update that patient
      if (session.patient_id) {
        const { error: updatePatientError } = await supabase
          .from('patients')
          .update({
            full_name: data.fullName,
            age: data.dateOfBirth ? new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear() : null,
            relationship: data.relationship,
          })
          .eq('id', session.patient_id);

        if (updatePatientError) {
          console.error('Error updating patient data:', updatePatientError);
          return NextResponse.json({ error: "Failed to save patient data" }, { status: 500 });
        }
      } else {
        // Otherwise, create a new patient and attach it to the current session
        const { data: newPatient, error: insertPatientError } = await supabase
          .from('patients')
          .insert({
            family_id: family.id,
            full_name: data.fullName,
            age: data.dateOfBirth ? new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear() : null,
            relationship: data.relationship,
            care_level: 'independent', // Default, will be updated later
            status: 'active',
          })
          .select('id')
          .single();

        if (insertPatientError || !newPatient) {
          console.error('Error creating patient data:', insertPatientError);
          return NextResponse.json({ error: "Failed to save patient data" }, { status: 500 });
        }

        // Link the newly created patient to the onboarding session
        const { error: linkError } = await supabase
          .from('patient_onboarding_sessions')
          .update({ patient_id: newPatient.id, updated_at: new Date().toISOString() })
          .eq('id', session.id);

        if (linkError) {
          console.error('Error linking patient to session:', linkError);
          return NextResponse.json({ error: "Failed to link patient to session" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in save step:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
