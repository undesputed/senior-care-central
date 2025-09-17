import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function OnboardingStep5Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/provider/login");

  return (
    <div className="min-h-[100dvh] px-4 py-8" style={{ backgroundColor: "#c2dacc" }}>
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
          <CardHeader>
            <CardTitle>Onboarding – Upload Documents & Photos</CardTitle>
            <CardDescription>We will set up storage and uploads next.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Placeholder for uploads. Coming next.</p>
            <div className="flex gap-3">
              <Link href="/provider/onboarding/step-4" className="underline">Back</Link>
              <Link href="/provider/dashboard" className="underline">Finish</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


