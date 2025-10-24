import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProviderMessagesClient from "./ProviderMessagesClient";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/provider/login");
  }

  // Check if onboarding is complete, redirect if not
  const { checkOnboardingCompletion } = await import('@/lib/onboarding/onboarding-utils')
  const { isComplete, nextStep } = await checkOnboardingCompletion(user.id)
  
  if (!isComplete) {
    redirect(nextStep || "/provider/onboarding/step-1")
  }

  return (
    <DashboardLayout title="Messages">
      <ProviderMessagesClient />
    </DashboardLayout>
  );
}
