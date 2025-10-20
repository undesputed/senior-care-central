import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-2 mt-4 mb-6">
          <Link href="/family/profile/care-recipients" className="inline-flex items-center text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back to Profile
          </Link>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Care Recipient Settings</h1>
        </div>
        {children}
      </div>
    </div>
  );
}


