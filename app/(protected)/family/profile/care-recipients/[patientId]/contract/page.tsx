import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PatientContractPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/family/login');

  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status, provider_name, accepted_at')
    .eq('family_id', family?.id || '')
    .eq('patient_id', patientId)
    .eq('status', 'accepted')
    .maybeSingle();

  const tabs = [
    { label: 'Summary', href: `/family/profile/care-recipients/${patientId}/summary` },
    { label: 'Invites', href: `/family/profile/care-recipients/${patientId}/invites` },
    { label: 'Contract', href: `/family/profile/care-recipients/${patientId}/contract` },
  ];

  return (
    <div>
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-100 rounded-lg overflow-hidden border border-gray-300" style={{ width: '593px', height: '56px' }}>
          {tabs.map((t, index) => (
            <Link 
              key={t.href} 
              href={t.href} 
              className={`flex items-center justify-center text-base font-medium h-full ${
                t.label === 'Contract' 
                  ? 'bg-[#71A37A] text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              style={{ 
                width: '198px', 
                height: '56px',
                borderRadius: index === 0 ? '8px 0 0 8px' : index === tabs.length - 1 ? '0 8px 8px 0' : '0'
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {!contract ? (
        <div className="text-center text-gray-700 mt-16">
          <div className="mx-auto w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 mb-3">i</div>
          <div>No active contract</div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="text-gray-900 font-medium">{contract.provider_name}</div>
          <div className="text-sm text-gray-600">Status: {contract.status}</div>
        </div>
      )}
    </div>
  );
}


