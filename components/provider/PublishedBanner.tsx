"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";

export function PublishedBanner() {
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const onUnpublish = async () => {
    const ok = confirm('Unpublishing will remove your profile from search results. Proceed?');
    if (!ok) return;
    
    setIsUnpublishing(true);
    try {
      const res = await fetch('/api/provider/unpublish', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        toast.error('Cannot unpublish', { description: json.error });
        return;
      }
      toast.success('Profile moved to draft');
      window.location.reload();
    } finally {
      setIsUnpublishing(false);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-green-900 mb-1">
            Profile Published Successfully
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Your agency profile is now live and visible to clients. You can start receiving referrals and inquiries.
          </p>
          <LoadingButton
            loading={isUnpublishing}
            loadingText="Unpublishing..."
            variant="outline"
            onClick={onUnpublish}
            className="border-green-300 text-green-700 hover:bg-green-100 font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Revert to Draft
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}


