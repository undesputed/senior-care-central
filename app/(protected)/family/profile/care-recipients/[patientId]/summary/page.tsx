import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PatientSummaryPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/family/login');

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .maybeSingle();

  // Care preferences (schedule, budget, selected services)
  const { data: prefs } = await supabase
    .from('patient_care_preferences')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  // Latest onboarding session → AI analysis
  const { data: latestSession } = await supabase
    .from('patient_onboarding_sessions')
    .select('id, updated_at')
    .eq('patient_id', patientId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: aiAnalysis } = latestSession ? await supabase
    .from('patient_ai_analysis')
    .select('*')
    .eq('session_id', latestSession.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null } as any;

  // Required services with levels (join to services for names)
  const { data: requirementsRaw } = await supabase
    .from('patient_service_requirements')
    .select('support_level, services(name)')
    .eq('patient_id', patientId);
  const requirements = requirementsRaw ?? [];

  // Simple tab header
  const tabs = [
    { label: 'Summary', href: `/family/profile/care-recipients/${patientId}/summary` },
    { label: 'Invites', href: `/family/profile/care-recipients/${patientId}/invites` },
    { label: 'Contract', href: `/family/profile/care-recipients/${patientId}/contract` },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-100 rounded-lg overflow-hidden border border-gray-300" style={{ width: '593px', height: '56px' }}>
          {tabs.map((t, index) => (
            <Link 
              key={t.href} 
              href={t.href} 
              className={`flex items-center justify-center text-base font-medium h-full ${
                t.label === 'Summary' 
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

      {/* Main content container - centered both horizontally and vertically */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
          <div className="space-y-8">
        {/* Care Recipient Description */}
        <div>
          <p className="text-gray-700 leading-relaxed">
            {patient?.notes || 'No summary available yet.'}
          </p>
        </div>

        {/* Key Care Needs */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Key care needs:</h3>
          <ul className="space-y-2">
            {(aiAnalysis?.care_needs || []).map((need: string, idx: number) => (
              <li key={idx} className="flex items-start">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">{need}</span>
              </li>
            ))}
            {(!aiAnalysis?.care_needs || aiAnalysis.care_needs.length === 0) && (
              <li className="text-gray-600">No care needs specified</li>
            )}
          </ul>
        </div>

        {/* Personal Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Personal Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-gray-600">DOB</div>
              <div className="text-gray-900">{patient?.birthday || '—'}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-600">Gender</div>
              <div className="text-gray-900">{patient?.gender || '—'}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-600">Relationship with patient</div>
              <div className="text-gray-900">{patient?.relationship || '—'}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-600">Body type</div>
              <div className="text-gray-900">Average</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-600">Zip Code</div>
              <div className="text-gray-900">{patient?.zip_code || '—'}</div>
            </div>
          </div>
        </div>

        {/* Services Needed */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Services needed</h3>
          <div className="space-y-3">
            {requirements.length > 0 ? (
              requirements.map((r: any, idx: number) => (
                <div key={idx} className="flex items-center">
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{r.services?.name || 'Service'}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#71A37A' }}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Personal care (bathing, dressing, grooming)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#71A37A' }}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Mobility assistance & safe transfers</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#71A37A' }}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Medication reminders and tracking</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#71A37A' }}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Meal preparation (light cooking, diet support)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#71A37A' }}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Transportation to medical appointments</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#71A37A' }}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Companionship and social engagement</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Schedule</h3>
          <div className="grid grid-cols-2 gap-y-3">
            <div className="text-gray-600">Care Type</div>
            <div className="text-gray-900">In-home senior care, 5 days/week</div>
            <div className="text-gray-600">Care Schedule</div>
            <div className="text-gray-900">Monday - Friday</div>
            <div className="text-gray-600">Times</div>
            <div className="text-gray-900">Morning (8 AM - 12 PM) & Evening (6 PM - 9 PM)</div>
            <div className="text-gray-600">Frequency</div>
            <div className="text-gray-900">2 sessions/day (10 sessions per week)</div>
          </div>
        </div>

        {/* Budget */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Budget</h3>
          <div className="grid grid-cols-2 gap-y-3">
            <div className="text-gray-600">Hourly Budget</div>
            <div className="text-gray-900">
              <span className="inline-block text-white rounded-full px-3 py-1 text-sm font-medium" style={{ backgroundColor: '#71A37A' }}>
                $40/hour
              </span>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}


