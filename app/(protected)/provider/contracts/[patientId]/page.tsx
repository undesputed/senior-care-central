import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PatientDetailClient from "./PatientDetailClient";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientDetailPageProps {
  params: Promise<{ patientId: string }>;
}

async function getPatientData(patientId: string) {
  const supabase = await createClient();
  
  const { data: patient, error } = await supabase
    .from('patients')
    .select(`
      id,
      full_name,
      age,
      relationship,
      care_level,
      medical_conditions,
      care_needs,
      status,
      notes,
      created_at,
      families!inner(
        id,
        full_name,
        phone_number,
        user_id
      )
    `)
    .eq('id', patientId)
    .single();

  if (error || !patient) {
    return null;
  }

  return patient;
}

async function getCareMatchData(patientId: string, agencyId: string) {
  const supabase = await createClient();
  
  const { data: match, error } = await supabase
    .from('care_matches')
    .select('id, score, created_at')
    .eq('patient_id', patientId)
    .eq('agency_id', agencyId)
    .single();

  if (error || !match) {
    return null;
  }

  return match;
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { patientId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/provider/login");
  }

  // Get agency ID for this user
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!agency) {
    redirect("/provider/onboarding/step-1");
  }

  const [patient, match] = await Promise.all([
    getPatientData(patientId),
    getCareMatchData(patientId, agency.id)
  ]);
  
  if (!patient || !match) {
    redirect('/provider/contracts');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<PatientDetailSkeleton />}>
        <PatientDetailClient 
          patient={patient} 
          match={match}
          agencyId={agency.id}
        />
      </Suspense>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="flex items-start space-x-4 mb-6">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        {/* Right Panel Skeleton */}
        <div className="bg-green-50 rounded-lg shadow-sm border border-gray-200 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
