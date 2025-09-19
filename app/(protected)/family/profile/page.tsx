import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyDashboardLayout from "@/components/layout/FamilyDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function FamilyProfilePage() {
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
      title="Profile" 
      userName={family?.full_name || user.email}
      showWelcome={false}
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{family?.full_name || 'Family Member'}</CardTitle>
                  <p className="text-gray-600">Family Account</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              
              {family?.phone_number && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-gray-600">{family.phone_number}</p>
                  </div>
                </div>
              )}

              {family?.preferred_contact_method && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Preferred Contact</p>
                    <p className="text-gray-600 capitalize">{family.preferred_contact_method}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Member Since</p>
                  <p className="text-gray-600">
                    {family?.created_at 
                      ? new Date(family.created_at).toLocaleDateString()
                      : 'Recently joined'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Account Status</p>
                  <p className="text-green-600 font-medium">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Features */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-900">Enhanced Profile Features</CardTitle>
                <p className="text-green-700 text-sm">Coming Soon</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-800 mb-4">
              We're working on additional profile features to help you manage your family's care needs better.
            </p>
            <div className="text-sm text-green-700">
              <p className="font-medium mb-2">Upcoming features:</p>
              <ul className="space-y-1">
                <li>• Family member profiles and care preferences</li>
                <li>• Emergency contact management</li>
                <li>• Care history and notes</li>
                <li>• Document storage and sharing</li>
                <li>• Notification preferences</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </FamilyDashboardLayout>
  );
}
