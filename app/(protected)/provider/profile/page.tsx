import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublishBanner } from "@/components/provider/PublishBanner";
import { PublishedBanner } from "@/components/provider/PublishedBanner";
import { SignOutButton } from "@/components/auth/sign-out-button";
import ProfileActions from "@/components/profile/ProfileActions";
import { MapPin, Phone, Mail, Globe, Calendar, Building } from "lucide-react";

export default async function ProviderProfilePage() {
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
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!agency) {
    redirect("/provider/onboarding/step-1");
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'draft':
        return 'Draft';
      case 'suspended':
        return 'Suspended';
      default:
        return 'Unknown';
    }
  };

  return (
    <DashboardLayout title="Profile">
      <div className="p-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center space-x-4">
            {agency.logo_url ? (
              <img
                src={agency.logo_url}
                alt="Agency logo"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Building className="w-8 h-8 text-green-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{agency.business_name || 'Unnamed Agency'}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(agency.status)}>
                  {getStatusText(agency.status)}
                </Badge>
                {agency.onboarding_completed && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Onboarding Complete
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <SignOutButton />
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-6">
          {agency.status !== 'published' ? (
            <PublishBanner />
          ) : (
            <PublishedBanner />
          )}
        </div>

        {/* Agency Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Business Name</p>
                  <p className="font-medium">{agency.business_name || 'Not provided'}</p>
                </div>
              </div>
              
              {agency.business_registration_number && (
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Registration Number</p>
                    <p className="font-medium">{agency.business_registration_number}</p>
                  </div>
                </div>
              )}

              {agency.year_established && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Year Established</p>
                    <p className="font-medium">{agency.year_established}</p>
                  </div>
                </div>
              )}

              {agency.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a 
                      href={agency.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {agency.website}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{agency.email || user.email}</p>
                </div>
              </div>

              {agency.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{agency.phone}</p>
                  </div>
                </div>
              )}

              {agency.admin_contact_name && (
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Admin Contact</p>
                    <p className="font-medium">{agency.admin_contact_name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Service Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {agency.cities && agency.cities.length > 0 && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Cities</p>
                    <p className="font-medium">{agency.cities.join(', ')}</p>
                  </div>
                </div>
              )}

              {agency.postal_codes && agency.postal_codes.length > 0 && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Postal Codes</p>
                    <p className="font-medium">{agency.postal_codes.join(', ')}</p>
                  </div>
                </div>
              )}

              {agency.coverage_radius_km && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Coverage Radius</p>
                    <p className="font-medium">{agency.coverage_radius_km} km</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Status */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Onboarding Status</span>
                <Badge className={agency.onboarding_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {agency.onboarding_completed ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profile Status</span>
                <Badge className={getStatusColor(agency.status)}>
                  {getStatusText(agency.status)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Permit Verified</span>
                <Badge className={agency.permit_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {agency.permit_verified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Last Updated</p>
                <p className="font-medium">
                  {new Date(agency.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <ProfileActions />
      </div>
    </DashboardLayout>
  );
}
