import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientData, selectedServices, schedulePreferences, budgetPreferences } = await request.json();

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
      .select('id, patient_id')
      .eq('family_id', family.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return NextResponse.json({ error: "No active session found" }, { status: 404 });
    }

    // Parse location data
    const locationParts = patientData.location ? patientData.location.split(',').map(s => s.trim()) : [];
    const city = locationParts[0] || null;
    const state = locationParts[1] || null;

    // Get or create patient record
    let patientId = session.patient_id;
    if (!patientId) {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          family_id: family.id,
          full_name: patientData.fullName,
          age: patientData.dateOfBirth ? new Date().getFullYear() - new Date(patientData.dateOfBirth).getFullYear() : null,
          relationship: patientData.relationship,
          care_level: 'independent',
          status: 'active',
          city: city,
          state: state,
        })
        .select()
        .single();

      if (patientError) {
        console.error('Error creating patient:', patientError);
        return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
      }

      patientId = patient.id;
    } else {
      // Update existing patient with location data if not already set
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          city: city,
          state: state,
        })
        .eq('id', patientId)
        .is('city', null); // Only update if city is null

      if (updateError) {
        console.error('Error updating patient location:', updateError);
      }
    }

    // Save care preferences
    const { error: preferencesError } = await supabase
      .from('patient_care_preferences')
      .upsert({
        patient_id: patientId,
        selected_services: selectedServices,
        schedule_preferences: schedulePreferences,
        budget_preferences: budgetPreferences,
      });

    if (preferencesError) {
      console.error('Error saving care preferences:', preferencesError);
      return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
    }

    // Save patient service requirements for matching
    if (selectedServices && selectedServices.length > 0) {
      // Fetch services to validate and map service IDs
      const { data: services } = await supabase
        .from('services')
        .select('id, name');

      const serviceRequirements = selectedServices
        .map((service: any) => {
          // If serviceId is not a valid UUID, try to find by name
          let serviceId = service.serviceId;
          if (!serviceId || serviceId.match(/^[0-9]+$/)) {
            const matchingService = services?.find(s => 
              s.name.toLowerCase() === service.serviceName.toLowerCase()
            );
            serviceId = matchingService?.id || serviceId;
          }

          return {
            patient_id: patientId,
            service_id: serviceId,
            support_level: service.level === 'full' ? 4 : 
                          service.level === 'hand_on' ? 3 :
                          service.level === 'occasional' ? 2 : 1
          };
        })
        .filter((req: any) => req.service_id && req.service_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)); // Only valid UUIDs

      if (serviceRequirements.length > 0) {
        const { error: requirementsError } = await supabase
          .from('patient_service_requirements')
          .upsert(serviceRequirements, { onConflict: 'patient_id,service_id' });

        if (requirementsError) {
          console.error('Error saving service requirements:', requirementsError);
          return NextResponse.json({ error: "Failed to save service requirements" }, { status: 500 });
        }
      }
    }

    // Mark session as completed
    const { error: completeError } = await supabase
      .from('patient_onboarding_sessions')
      .update({ 
        patient_id: patientId,
        is_completed: true,
        current_step: 7,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (completeError) {
      console.error('Error completing session:', completeError);
      return NextResponse.json({ error: "Failed to complete session" }, { status: 500 });
    }

    return NextResponse.json({ success: true, patientId });
  } catch (error) {
    console.error('Error in finalize onboarding:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
