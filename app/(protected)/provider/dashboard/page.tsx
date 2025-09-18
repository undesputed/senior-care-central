import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <DashboardLayout 
      title="Dashboard" 
      showSearch={true} 
      showFilters={true} 
      showViewToggle={true}
    >
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back, {agency?.business_name || user.email}!
          </h2>
          <p className="text-gray-600">
            Here's an overview of your agency's activity and performance.
          </p>
        </div>

        {/* Status Banner */}
        <div className="mb-6">
          {agency?.status !== 'published' ? (
            <PublishBanner />
          ) : (
            <PublishedBanner />
          )}
        </div>

        {/* Placeholder Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">0</div>
              <p className="text-sm text-gray-600">No clients yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">0</div>
              <p className="text-sm text-gray-600">No active contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">$0</div>
              <p className="text-sm text-gray-600">No revenue yet</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <p>No recent activity to display.</p>
                <p className="text-sm mt-2">Activity will appear here as you start working with clients.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}