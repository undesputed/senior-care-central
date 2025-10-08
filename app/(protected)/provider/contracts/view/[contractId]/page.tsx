import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ContractDetailsClient from "./ContractDetailsClient";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractDetailsPageProps {
  params: Promise<{ contractId: string }>;
}

async function getContractData(contractId: string) {
  const supabase = await createClient();
  
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      *,
      patients!inner(
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
      ),
      agencies!inner(
        id,
        business_name,
        email,
        phone,
        status
      )
    `)
    .eq('id', contractId)
    .single();

  if (error || !contract) {
    return null;
  }

  return contract;
}

export default async function ContractDetailsPage({ params }: ContractDetailsPageProps) {
  const { contractId } = await params;
  
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

  const contract = await getContractData(contractId);
  
  if (!contract) {
    redirect('/provider/contracts');
  }

  return (
    <Suspense fallback={<ContractDetailsSkeleton />}> 
      <ContractDetailsClient 
        contract={contract}
        agencyId={agency.id}
      />
    </Suspense>
  );
}

function ContractDetailsSkeleton() {
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
            <Skeleton className="h-10 w-32" /> {/* Action buttons */}
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}


