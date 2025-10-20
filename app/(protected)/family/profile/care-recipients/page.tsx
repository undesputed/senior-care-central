import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default async function CareRecipientSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/family/login");

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!family) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <div className="flex items-center gap-2 mt-4 mb-6">
            <Link href="/family/profile" className="inline-flex items-center text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-1" /> Back to Profile
            </Link>
          </div>
          <div className="text-center text-gray-600">No family record found.</div>
        </div>
      </div>
    );
  }

  const { data: patients = [] } = await supabase
    .from("patients")
    .select("id, full_name, relationship")
    .eq("family_id", family.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-2 mt-4 mb-6">
          <Link href="/family/profile" className="inline-flex items-center text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back to Profile
          </Link>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Care Recipient Settings</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients?.map((p) => (
            <Link key={p.id} href={`/family/profile/care-recipients/${p.id}`} className="block">
              <Card className="bg-green-50 hover:shadow-md transition-shadow w-full" style={{ height: '72px' }}>
                <CardContent className="p-0 h-full">
                  <div className="flex items-center h-full px-2">
                    <div className="relative flex-shrink-0" style={{ width: '56px', height: '56px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f0f9f0' }}>
                      <Image src="/person-placeholder.svg" alt={p.full_name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col justify-center ml-3 flex-1">
                      <div className="font-medium text-gray-900 text-left">{p.full_name}</div>
                      <div className="text-xs text-gray-600 text-left">{p.relationship || "—"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {patients?.length === 0 && (
            <div className="col-span-full text-center text-gray-600">No patients yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}


