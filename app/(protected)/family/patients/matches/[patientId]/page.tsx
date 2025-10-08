import { createClient } from "@/lib/supabase/server";
import { protectRoute } from "@/lib/auth/role-based-routing";
import { redirect } from "next/navigation";
import PatientMatchesClient from "./PatientMatchesClient";

interface PageProps {
  params: {
    patientId: string;
  };
}

export default async function PatientMatchesPage({ params }: PageProps) {
  // Await params before using its properties (Next.js 15 requirement)
  const { patientId } = await params;
  
  // Protect this route for family users only
  const userInfo = await protectRoute(['family']);
  
  const supabase = await createClient();
  
  // Verify patient belongs to current user
  const { data: patient } = await supabase
    .from('patients')
    .select(`
      id,
      full_name,
      family_id,
      families!inner(user_id)
    `)
    .eq('id', patientId)
    .eq('families.user_id', userInfo.userId)
    .single();

  if (!patient) {
    redirect('/family/patients');
  }

  return (
    <PatientMatchesClient 
      patientId={patientId}
      patientName={patient.full_name}
    />
  );
}
