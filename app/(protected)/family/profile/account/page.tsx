"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default function AccountSecurityPage() {
  const items = [
    { label: "Change Email", href: "/family/profile/account/email" },
    { label: "Change Phone", href: "/family/profile/account/phone" },
    { label: "Change Password", href: "/family/profile/account/password" },
  ];

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mt-4 mb-6">
          <Link href="/family/profile" className="inline-flex items-center text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back to Profile
          </Link>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Account & Security</h1>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.href}>
              <CardContent className="p-0">
                <Link href={item.href} className="w-full flex items-center justify-between px-5 py-5 text-[18px] font-semibold text-gray-900">
                  <span>{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-green-600" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


