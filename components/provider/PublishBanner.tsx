"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PublishBanner() {
  const onPublish = async () => {
    const res = await fetch('/api/provider/publish', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) {
      toast.error('Cannot publish', { description: json.error });
      return;
    }
    toast.success('Profile published');
    window.location.reload();
  };

  return (
    <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
      <div className="mb-2 font-medium">Your agency profile is in draft and not yet visible to clients.</div>
      <Button onClick={onPublish} style={{ backgroundColor: '#9bc3a2' }}>Publish My Profile</Button>
    </div>
  );
}


