import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Step1Form from "./Step1Form";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";

export default async function OnboardingStep1Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/provider/login");
  }

  // Ensure draft agency exists for this user
  const { data: existing } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await supabase.from('agencies').insert({ owner_id: user.id, email: user.email, status: 'draft' });
  }

  return (
    <div className="min-h-[100dvh] px-4 py-8" style={{ backgroundColor: "#c2dacc" }}>
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
          <CardHeader>
            <CardTitle>Onboarding – Basic Info</CardTitle>
            <CardDescription>We&apos;ll collect your business details to build your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingStepper />
            <Step1Form email={user.email ?? null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


