"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PublishedBanner() {
  const onUnpublish = async () => {
    const ok = confirm('Unpublishing will remove your profile from search results. Proceed?');
    if (!ok) return;
    const res = await fetch('/api/provider/unpublish', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) {
      toast.error('Cannot unpublish', { description: json.error });
      return;
    }
    toast.success('Profile moved to draft');
    window.location.reload();
  };

  return (
    <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4">
      <div className="mb-2 font-medium">Your profile is published and visible to clients.</div>
      <Button variant="outline" onClick={onUnpublish}>Revert to Draft</Button>
    </div>
  );
}


