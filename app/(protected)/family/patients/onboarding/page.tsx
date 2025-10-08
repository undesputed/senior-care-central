import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { protectRoute } from "@/lib/auth/role-based-routing";
import PatientOnboardingWizard from "@/components/patient-onboarding/PatientOnboardingWizard";

export default async function PatientOnboardingPage() {
  // Protect this route for family users only
  const userInfo = await protectRoute(['family']);
  
  const supabase = await createClient();
  
  // Get family profile for context
  const { data: family } = await supabase
    .from('families')
    .select('full_name')
    .eq('user_id', userInfo.userId)
    .maybeSingle();

  return (
    <PatientOnboardingWizard 
      familyName={family?.full_name || userInfo.profile?.email || 'Family'}
      userId={userInfo.userId}
    />
  );
}
