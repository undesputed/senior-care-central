import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/patient-onboarding/cancel
// Body: { sessionId: string }
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Verify session belongs to the current family user
    const { data: family, error: familyErr } = await supabase
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (familyErr || !family) {
      return NextResponse.json({ error: "Family profile not found" }, { status: 403 });
    }

    const { data: sessionRow, error: sessionErr } = await supabase
      .from("patient_onboarding_sessions")
      .select("id, family_id")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessionErr || !sessionRow || sessionRow.family_id !== family.id) {
      return NextResponse.json({ error: "Session not found or not allowed" }, { status: 404 });
    }

    // Delete dependent rows first (respecting RLS). Order matters if FKs don't cascade.
    await supabase.from("patient_ai_conversations").delete().eq("session_id", sessionId);
    await supabase.from("patient_ai_analysis").delete().eq("session_id", sessionId);
    await supabase.from("patient_care_preferences").delete().eq("session_id", sessionId);

    // Handle uploaded files: delete storage objects, then metadata rows
    const { data: files } = await supabase
      .from("patient_uploaded_files")
      .select("storage_path")
      .eq("session_id", sessionId);

    if (files && files.length > 0) {
      const paths = files
        .map((f: { storage_path?: string | null }) => f.storage_path)
        .filter(Boolean) as string[];
      if (paths.length > 0) {
        // Best-effort delete; ignore failures to avoid blocking cleanup
        try {
          await supabase.storage.from("patient-documents").remove(paths);
        } catch (e) {
          // noop
        }
      }
    }
    await supabase.from("patient_uploaded_files").delete().eq("session_id", sessionId);

    // Finally delete the session row
    await supabase.from("patient_onboarding_sessions").delete().eq("id", sessionId);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}


