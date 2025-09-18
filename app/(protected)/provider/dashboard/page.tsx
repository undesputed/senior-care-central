import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PublishBanner } from "@/components/provider/PublishBanner";
import { PublishedBanner } from "@/components/provider/PublishedBanner";

export default async function ProviderDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/provider/login");
  }

  // Verify user still exists in profiles table (handles deleted users)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    // User was deleted from database, clear session and redirect to login
    await supabase.auth.signOut();
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
    .select('status')
    .eq('owner_id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-[100dvh] px-4 py-8" style={{ backgroundColor: "#c2dacc" }}>
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Provider Dashboard</CardTitle>
            <SignOutButton />
          </CardHeader>
          <CardContent>
            <p>Welcome{user.email ? `, ${user.email}` : ""}. Your provider portal will appear here.</p>
            {agency?.status !== 'published' ? <PublishBanner /> : <PublishedBanner />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


