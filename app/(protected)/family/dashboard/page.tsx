import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyDashboardLayout from "@/components/layout/FamilyDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, MessageCircle, Calendar, FileText } from "lucide-react";

export default async function FamilyDashboardPage() {
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
      title="Dashboard" 
      userName={family?.full_name || user.email}
    >
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Find the Perfect Care for Your Loved One
          </h2>
          <p className="text-lg text-gray-600">
            Discover trusted care providers in your area with personalized recommendations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for care providers, services, or locations..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Find Providers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Browse and search for care providers in your area
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">View on Map</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                See providers near you with interactive maps
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Chat with care providers and get answers
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Schedule Tours</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Book visits and consultations with providers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Providers */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Featured Care Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder Provider Cards */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 font-semibold">P{i}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Provider {i}</CardTitle>
                      <p className="text-sm text-gray-600">Senior Care Services</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">(4.8)</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive senior care services with experienced staff and modern facilities.
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1" style={{ backgroundColor: "#9bc3a2" }}>
                      View Profile
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium mb-2">No Recent Activity</h4>
                <p className="text-sm">
                  Start by searching for care providers or scheduling your first consultation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </FamilyDashboardLayout>
  );
}
