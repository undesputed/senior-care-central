import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import UploadsForm from "./UploadsForm";

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
            <CardDescription>Upload required documents and optional photos.</CardDescription>
          </CardHeader>
          <CardContent>
            <UploadsForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


