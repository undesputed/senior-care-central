import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default async function ContractsPage() {
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
    <DashboardLayout 
      title="Contract Management" 
      showSearch={true} 
      showFilters={true} 
      showViewToggle={true}
    >
      <div className="p-6">
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-medium mb-2">Contract Management</h3>
          <p>Contract management features will be implemented here.</p>
          <p className="text-sm mt-2">This will include client contracts, agreements, and contract status tracking.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
