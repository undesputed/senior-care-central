import { createClient } from "@/lib/supabase/server";
import GenerateInvoiceClient from "./GenerateInvoiceClient";
import { redirect } from "next/navigation";

interface Props { params: Promise<{ contractId: string }> }

export default async function GenerateInvoicePage({ params }: Props) {
  const { contractId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/provider/login');

  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  const { data: contract } = await supabase
    .from('contracts')
    .select(`*, patients(full_name, age, families(full_name, phone_number, user_id))`)
    .eq('id', contractId)
    .single();

  if (!agency || !contract) redirect('/provider/contracts');

  return <GenerateInvoiceClient contract={contract as any} agencyId={agency.id} />
}


