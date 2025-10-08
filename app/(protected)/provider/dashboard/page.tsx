import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublishBanner } from "@/components/provider/PublishBanner";
import { PublishedBanner } from "@/components/provider/PublishedBanner";
import ProviderDashboardClient from "./ProviderDashboardClient";

export default async function ProviderDashboardPage() {
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

  const { data: agency } = await supabase
    .from('agencies')
    .select('status, business_name')
    .eq('owner_id', user.id)
    .maybeSingle();

  return (
    <ProviderDashboardClient 
      agency={agency}
      user={user}
    />
  );
}