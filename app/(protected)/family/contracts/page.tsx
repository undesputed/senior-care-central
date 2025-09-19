import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyDashboardLayout from "@/components/layout/FamilyDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle } from "lucide-react";

export default async function FamilyContractsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/family/login");
  }

  // Get family profile
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <FamilyDashboardLayout 
      title="Contracts" 
      userName={family?.full_name || user.email}
    >
      <div className="space-y-6">
        {/* Coming Soon Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-blue-900">Contract Management</CardTitle>
                <p className="text-blue-700 text-sm">Coming Soon</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">
              We're working on bringing you a comprehensive contract management system. 
              Soon you'll be able to view, manage, and track all your care agreements in one place.
            </p>
          </CardContent>
        </Card>

        {/* Placeholder Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg">Pending Contracts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Awaiting your review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Active Contracts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Currently in effect</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Total Contracts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Contracts Yet</h3>
            <p className="text-gray-600 mb-6">
              Once you start working with care providers, your contracts will appear here.
            </p>
            <div className="text-sm text-gray-500">
              <p>Contract management features coming soon:</p>
              <ul className="mt-2 space-y-1">
                <li>• View contract details and terms</li>
                <li>• Track payment schedules</li>
                <li>• Manage contract renewals</li>
                <li>• Download contract documents</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </FamilyDashboardLayout>
  );
}
