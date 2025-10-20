import { redirect } from "next/navigation";

export default async function PatientDefaultPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  redirect(`/family/profile/care-recipients/${patientId}/summary`);
}


