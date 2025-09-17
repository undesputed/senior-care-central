import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StrengthsForm from "./StrengthsForm";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";

export default async function OnboardingStep3Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/provider/login");

  return (
    <div className="min-h-[100dvh] px-4 py-8" style={{ backgroundColor: "#c2dacc" }}>
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
          <CardHeader>
            <CardTitle>Onboarding – Distribute Star Points</CardTitle>
            <CardDescription>Allocate up to 20 points across selected services.</CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingStepper />
            <StrengthsForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


