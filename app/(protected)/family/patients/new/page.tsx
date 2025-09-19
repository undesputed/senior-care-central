import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyDashboardLayout from "@/components/layout/FamilyDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, User, Heart, FileText } from "lucide-react";
import Link from "next/link";

export default async function AddPatientPage() {
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
      title="Add New Patient" 
      userName={family?.full_name || user.email}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center">
          <Link href="/family/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
          </Link>
        </div>

        {/* Coming Soon Banner */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-900">Patient Onboarding</CardTitle>
                <p className="text-green-700 text-sm">Coming Soon</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-800 mb-4">
              We're building a comprehensive patient onboarding system that will help you 
              collect and organize all the important information about your loved ones.
            </p>
            <div className="text-sm text-green-700">
              <p className="font-medium mb-2">Upcoming features:</p>
              <ul className="space-y-1">
                <li>• Basic patient information (name, age, relationship)</li>
                <li>• Medical history and current conditions</li>
                <li>• Care needs and preferences</li>
                <li>• Emergency contact information</li>
                <li>• Insurance and payment details</li>
                <li>• Care level assessment</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Preview of Form Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-blue-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg text-blue-900">Basic Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Full name and age</li>
                <li>• Relationship to family member</li>
                <li>• Contact information</li>
                <li>• Emergency contacts</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-lg text-red-900">Medical Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Current medical conditions</li>
                <li>• Medications and allergies</li>
                <li>• Medical history</li>
                <li>• Healthcare providers</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg text-purple-900">Care Needs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Care level assessment</li>
                <li>• Daily living assistance</li>
                <li>• Special care requirements</li>
                <li>• Care preferences</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card>
          <CardContent className="p-8 text-center">
            <Plus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Onboarding Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              We're working hard to bring you a comprehensive patient management system. 
              Soon you'll be able to easily add and manage all your loved ones' information.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/family/patients">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Patients
                </Button>
              </Link>
              <Link href="/family/dashboard">
                <Button style={{ backgroundColor: "#9bc3a2" }}>
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </FamilyDashboardLayout>
  );
}
