import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, ChevronRight } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default async function FamilyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/family/login");
  }

  // Get family profile
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Derive initial for avatar
  const displayName = family?.full_name || "Family Member";
  const initial = (displayName || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mt-4 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        </div>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-green-200 flex items-center justify-center text-4xl font-semibold text-gray-800">
            {initial}
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>

        {/* Personal Info */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Personal Info</h2>
          <Card>
            <CardContent className="p-0">
              <div>
                <div className="flex items-center justify-between px-5 py-4 text-[15px]">
                  <span className="text-gray-700">Phone</span>
                  <span className="text-gray-900">{family?.phone || family?.phone_number || "—"}</span>
                </div>
                <hr className="border-t border-green-200" />
                <div className="flex items-start justify-between px-5 py-4 text-[15px]">
                  <span className="text-gray-700">Address</span>
                  <span className="text-right text-gray-900 max-w-[70%] leading-6">
                    {family?.address || family?.address_line || "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings List */}
        <div className="space-y-2">
          {["Account & Security",
            "Care Recipient Settings",
            "Payment & Billing",
            "Notifications",
            "Privacy & Consent",
          ].map((label) => (
            <Card key={label}>
              <CardContent className="p-0">
                {label === 'Account & Security' ? (
                  <a href="/family/profile/account" className="w-full flex items-center justify-between px-5 py-5 text-[18px] font-semibold text-gray-900">
                    <span>{label}</span>
                    <ChevronRight className="w-5 h-5 text-green-600" />
                  </a>
                ) : (
                  label === 'Care Recipient Settings' ? (
                    <a href="/family/profile/care-recipients" className="w-full flex items-center justify-between px-5 py-5 text-[18px] font-semibold text-gray-900">
                      <span>{label}</span>
                      <ChevronRight className="w-5 h-5 text-green-600" />
                    </a>
                  ) : (
                    label === 'Privacy & Consent' ? (
                      <a href="/family/profile/privacy" className="w-full flex items-center justify-between px-5 py-5 text-[18px] font-semibold text-gray-900">
                        <span>{label}</span>
                        <ChevronRight className="w-5 h-5 text-green-600" />
                      </a>
                    ) : (
                      <button className="w-full flex items-center justify-between px-5 py-5 text-[18px] font-semibold text-gray-900">
                        <span>{label}</span>
                        <ChevronRight className="w-5 h-5 text-green-600" />
                      </button>
                    )
                  )
                )}
              </CardContent>
            </Card>
          ))}

          {/* Logout row */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 py-5">
                <span className="text-[18px] font-semibold text-red-600">Logout</span>
                <div className="flex items-center gap-3">
                  <LogoutButton />
                  <ChevronRight className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
