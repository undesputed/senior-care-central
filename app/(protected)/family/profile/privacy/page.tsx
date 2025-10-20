"use client";

import Link from "next/link";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function PrivacyAndConsentPage() {
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(true);

  const handleToggle = (checked: boolean) => {
    setMarketingOptIn(checked);
    // In a real app, persist preference via API
    toast.success(checked ? "Marketing communications enabled" : "Marketing communications disabled");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <div className="mb-6">
          <Link href="/family/profile" className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 mr-2">←</span>
            Back to Profile
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-6">Privacy & Consent</h1>

        {/* Marketing toggle row */}
        <div className="mx-auto mb-8" style={{ width: 396 }}>
          <div
            className="flex items-center justify-between px-4"
            style={{ height: 60, borderRadius: 8, background: '#F0F9F2' }}
          >
            <span className="text-sm text-gray-700">Receive Marketing communications</span>
            <Switch
              checked={marketingOptIn}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-[#71A37A] data-[state=unchecked]:bg-white"
              style={{ width: 40, height: 20, border: '1px solid #B4E6BC' }}
            />
          </div>
        </div>

        {/* Policy content */}
        <div className="mx-auto" style={{ maxWidth: 640 }}>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Privacy Policy</h2>
          <p className="text-xs text-gray-500 mb-4">Last Updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="space-y-4 text-sm leading-6 text-gray-700">
            <p>
              At Senior Care Central ("we", "our" or "us"), we are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, store, and safeguard information when you use our website or mobile application.
            </p>

            <h3 className="font-semibold text-gray-900">1. Information We Collect</h3>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6">
              <li>Personal Information: name, email address, phone number, and account credentials.</li>
              <li>Care Details: information you share about care needs, family members, health conditions, and preferences.</li>
              <li>Payment Information: processed securely through our third-party provider.</li>
              <li>Usage Data: device details and analytics on how you interact with our platform.</li>
            </ul>

            <h3 className="font-semibold text-gray-900">2. How We Use Your Information</h3>
            <ul className="list-disc pl-6">
              <li>Provide and improve our services</li>
              <li>Match families with suitable care providers</li>
              <li>Facilitate communication and contract management between clients and agencies</li>
              <li>Ensure platform safety, security, and compliance</li>
            </ul>

            <h3 className="font-semibold text-gray-900">3. Your Choices</h3>
            <p>
              You may update your communication preferences at any time using the toggle above. You can also request access to or deletion of your data by contacting support.
            </p>

            <h3 className="font-semibold text-gray-900">4. Data Security</h3>
            <p>
              We implement industry-standard measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h3 className="font-semibold text-gray-900">5. Contact Us</h3>
            <p>If you have questions about this policy, please contact our support team.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


