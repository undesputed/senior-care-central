"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { toast } from "sonner";

export function PublishBanner() {
  const [isPublishing, setIsPublishing] = useState(false);

  const onPublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/provider/publish', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        toast.error('Cannot publish', { description: json.error });
        return;
      }
      toast.success('Profile published');
      window.location.reload();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Ready to Go Live?
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Your agency profile is in draft and not yet visible to clients. Complete your setup and publish to start receiving referrals.
          </p>
          <LoadingButton
            loading={isPublishing}
            loadingText="Publishing..."
            onClick={onPublish}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Publish My Profile
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}


