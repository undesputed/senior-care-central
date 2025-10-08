import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AgencyDetailsClient from "./AgencyDetailsClient";
import { Skeleton } from "@/components/ui/skeleton";

interface AgencyDetailsPageProps {
  params: Promise<{ agencyId: string }>;
}

async function getAgencyData(agencyId: string) {
  const supabase = await createClient();
  
  const { data: agency, error } = await supabase
    .from('agencies')
    .select(`
      id,
      business_name,
      description,
      phone,
      email,
      website,
      logo_url,
      year_established,
      agency_service_areas(city, state),
      agency_services(
        service_id,
        services(name, slug)
      ),
      agency_service_strengths(
        service_id,
        points,
        services(name, slug)
      ),
      agency_service_rates(
        service_id,
        pricing_format,
        min_amount,
        max_amount,
        services(name, slug)
      )
    `)
    .eq('id', agencyId)
    .eq('status', 'published')
    .single();

  if (error || !agency) {
    return null;
  }

  return agency;
}

export default async function AgencyDetailsPage({ params }: AgencyDetailsPageProps) {
  const { agencyId } = await params;
  
  const agency = await getAgencyData(agencyId);
  
  if (!agency) {
    redirect('/family/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<AgencyDetailsSkeleton />}>
        <AgencyDetailsClient agency={agency} />
      </Suspense>
    </div>
  );
}

function AgencyDetailsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Match Info Skeleton */}
      <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex space-x-4 mb-8">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-32" />
      </div>

      {/* Image Skeleton */}
      <Skeleton className="h-64 w-full mb-6" />

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
