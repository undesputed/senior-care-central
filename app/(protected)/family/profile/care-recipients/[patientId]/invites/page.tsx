import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default async function PatientInvitesPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/family/login');

  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: invites = [] } = await supabase
    .from('contracts')
    .select('id, status, provider_name, patient_id, patients:patients(full_name)')
    .eq('family_id', family?.id || '')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

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
                t.label === 'Invites' 
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

      <div className="space-y-3 mx-auto" style={{ width: '593px' }}>
        {invites?.map((c) => {
          const status = (c.status || '').toString().toUpperCase();
          const statusStyles =
            status === 'NEGOTIATING'
              ? { bg: '#3B82F6', text: 'white' } // blue
              : status === 'REJECTED'
              ? { bg: '#DC2626', text: 'white' } // red
              : status === 'NO CONTRACT'
              ? { bg: '#F59E0B', text: 'white' } // amber
              : { bg: '#9CA3AF', text: 'white' }; // gray fallback

          return (
            <Card
              key={c.id}
              className="rounded-xl"
              style={{
                width: '593px',
                height: '72px',
                backgroundColor: '#F0F9F2',
                border: '1px solid #71A37A',
              }}
            >
              <CardContent className="px-4 flex items-center justify-between h-full">
                {/* Left: Agency image */}
                <div className="flex items-center">
                  <div className="relative mr-4" style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden' }}>
                    <Image src="/person-placeholder.svg" alt={c.provider_name} fill className="object-cover" />
                  </div>

                  {/* Middle: Agency details */}
                  <div>
                    <div className="text-lg font-semibold text-gray-900 leading-6">{c.provider_name}</div>
                    <div className="text-sm text-gray-600">For: {(Array.isArray(c.patients) ? c.patients[0]?.full_name : (c as any).patients?.full_name) ?? 'This patient'}</div>
                  </div>
                </div>

                {/* Right: Chat icon + status pill */}
                <div className="flex items-center space-x-3">
                  <span
                    className="text-sm font-medium"
                    style={{
                      backgroundColor: statusStyles.bg,
                      color: statusStyles.text,
                      borderRadius: '30px',
                      padding: '6px 8px',
                      width: '102px',
                      lineHeight: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    {status || 'PENDING'}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {invites?.length === 0 && (
          <div className="text-center text-gray-600">No invites yet.</div>
        )}
      </div>
    </div>
  );
}


