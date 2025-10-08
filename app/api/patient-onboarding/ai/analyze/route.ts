import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { PatientAIService } from "@/lib/patient-onboarding/ai-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, sessionId } = await request.json();

    if (!text || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify session ownership
    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!family) {
      return NextResponse.json({ error: "Family profile not found" }, { status: 404 });
    }

    const { data: session } = await supabase
      .from('patient_onboarding_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('family_id', family.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch available services to map AI suggestions to real UUIDs
    const { data: services } = await supabase
      .from('services')
      .select('id, name, slug')
      .order('name');

    // Analyze with AI
    const analysis = await PatientAIService.analyzeInput(text, services || []);

    // Save conversation message
    const { error: messageError } = await supabase
      .from('patient_ai_conversations')
      .insert({
        session_id: sessionId,
        message_type: 'user',
        content: text,
      });

    if (messageError) {
      console.error('Error saving user message:', messageError);
    }

    // Save AI response
    const { error: aiMessageError } = await supabase
      .from('patient_ai_conversations')
      .insert({
        session_id: sessionId,
        message_type: 'ai',
        content: JSON.stringify(analysis),
        detected_entities: analysis.detectedEntities,
        follow_up_questions: analysis.followUpQuestions,
      });

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError);
    }

    // Save analysis result
    const { error: analysisError } = await supabase
      .from('patient_ai_analysis')
      .upsert({
        session_id: sessionId,
        detected_conditions: analysis.detectedEntities.map(e => e.name),
        care_needs: analysis.careNeeds.map(n => n.description),
        suggested_services: analysis.suggestedServices,
        confidence_score: analysis.confidenceScore,
        analysis_complete: analysis.isComplete,
      });

    if (analysisError) {
      console.error('Error saving analysis:', analysisError);
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in AI analyze:', error);
    return NextResponse.json({ error: "Failed to analyze input" }, { status: 500 });
  }
}
