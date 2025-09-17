import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function OnboardingStep2Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/provider/login");

  return (
    <div className="min-h-[100dvh] px-4 py-8" style={{ backgroundColor: "#c2dacc" }}>
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
          <CardHeader>
            <CardTitle>Onboarding – Services Offered</CardTitle>
            <CardDescription>Select at least one service you provide.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Placeholder for services checklist. Coming next.</p>
            <div className="mt-4 flex gap-3">
              <Link href="/provider/onboarding/step-1" className="underline">Back</Link>
              <Link href="/provider/onboarding/step-3" className="underline">Next</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


