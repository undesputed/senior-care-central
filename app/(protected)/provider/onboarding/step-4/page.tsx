import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RatesForm from "./RatesForm";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";

export default async function OnboardingStep4Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/provider/login");

  return (
    <div className="min-h-[100dvh] px-4 py-8" style={{ backgroundColor: "#ffffff" }}>
      <div className="mx-auto max-w-3xl">
        <div className="space-y-6">
          <div className="w-full flex justify-center">
            <h1 className="text-2xl font-bold text-center">Agency Onboarding</h1>
          </div>
          <OnboardingStepper />
          <RatesForm />
        </div>
      </div>
    </div>
  );
}


