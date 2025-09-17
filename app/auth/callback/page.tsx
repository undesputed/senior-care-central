"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [status, setStatus] = useState<string>("Processing confirmation...");

  useEffect(() => {
    (async () => {
      // Supabase handles magic link confirmation automatically on redirect if the token is in the URL.
      // We can ensure profile creation and then redirect to onboarding.
      try {
        await fetch('/api/profile/ensure', { method: 'POST' });
        toast.success('Email confirmed');
        router.replace('/provider/onboarding/step-1');
      } catch (e: any) {
        setStatus('Could not complete confirmation. Please sign in.');
        toast.error('Confirmation failed');
        router.replace('/provider/login');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: "#c2dacc" }}>
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
        <CardHeader>
          <CardTitle>Email Confirmation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{status}</p>
        </CardContent>
      </Card>
    </div>
  );
}


