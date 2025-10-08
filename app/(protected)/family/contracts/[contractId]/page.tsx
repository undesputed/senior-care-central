import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyContractDetailsClient from "./FamilyContractDetailsClient";

interface Props { params: Promise<{ contractId: string }> }

export default async function FamilyContractDetailsPage({ params }: Props) {
  const { contractId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/family/login');

  const { data: family } = await supabase.from('families').select('id').eq('user_id', user.id).single();
  if (!family) redirect('/family/contracts');

  const { data: contract } = await supabase
    .from('contracts')
    .select(`*, agencies(id,business_name,phone,email), patients(id,full_name,age,families(full_name))`)
    .eq('id', contractId)
    .eq('family_id', family.id)
    .single();

  if (!contract) redirect('/family/contracts');

  return <FamilyContractDetailsClient contract={contract as any} />
}


