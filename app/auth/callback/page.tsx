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
      // Exchange the auth code from the email link for a session
      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (exchangeError) {
          throw exchangeError;
        }
        
        // Small delay to ensure session is properly set in cookies
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await fetch('/api/profile/ensure', { method: 'POST' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Profile creation failed');
        }
        
        toast.success('Email confirmed');
        router.replace('/provider/onboarding/step-1');
      } catch (e: any) {
        console.error('Auth callback error:', e);
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


