import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CreateContractClient from "./CreateContractClient";
import { Skeleton } from "@/components/ui/skeleton";

interface CreateContractPageProps {
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

  console.log('getPatientData - Patient ID:', patientId);
  console.log('getPatientData - Error:', error);
  console.log('getPatientData - Patient:', patient);

  if (error || !patient) {
    return null;
  }

  return patient;
}

async function getAgencyData(userId: string) {
  const supabase = await createClient();
  
  const { data: agency, error } = await supabase
    .from('agencies')
    .select(`
      id,
      business_name,
      email,
      phone,
      status
    `)
    .eq('owner_id', userId)
    .single();

  console.log('getAgencyData - User ID:', userId);
  console.log('getAgencyData - Error:', error);
  console.log('getAgencyData - Agency:', agency);

  if (error || !agency) {
    return null;
  }

  return agency;
}

export default async function CreateContractPage({ params }: CreateContractPageProps) {
  const { patientId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/provider/login");
  }

  // Get agency ID for the current user
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!agency) {
    redirect("/provider/onboarding/step-1");
  }

  const [patient, agencyData] = await Promise.all([
    getPatientData(patientId),
    getAgencyData(user.id)
  ]);
  
  // Debug logging
  console.log('Create Contract Page Debug:');
  console.log('Patient ID:', patientId);
  console.log('User ID:', user.id);
  console.log('Patient data:', patient);
  console.log('Agency data:', agencyData);
  
  if (!patient || !agencyData) {
    console.log('Missing data - redirecting to contracts page');
    redirect('/provider/contracts');
  }

  // Generate contract ID
  const contractId = `#CW-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

  return (
    <Suspense fallback={<CreateContractSkeleton />}>
      <CreateContractClient 
        patient={patient}
        agency={agencyData}
        contractId={contractId}
        agencyId={agency.id}
      />
    </Suspense>
  );
}

function CreateContractSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Skeleton */}
      <div className="bg-white border-b border-gray-200 h-16 w-full"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Skeleton className="h-6 w-48 mb-4" /> {/* Back button */}
          <Skeleton className="h-8 w-96 mb-2" /> {/* Title */}
          <Skeleton className="h-4 w-64 mb-6" /> {/* Draft info */}
          <div className="flex space-x-4 mb-6">
            <Skeleton className="h-8 w-24" /> {/* Tab 1 */}
            <Skeleton className="h-8 w-24" /> {/* Tab 2 */}
            <Skeleton className="h-8 w-24" /> {/* Tab 3 */}
          </div>
          <Skeleton className="h-64 w-full" /> {/* Content */}
          <div className="flex justify-center space-x-4 mt-8">
            <Skeleton className="h-10 w-32" /> {/* Save button */}
            <Skeleton className="h-10 w-32" /> {/* Send button */}
          </div>
        </div>
      </div>
    </div>
  );
}
