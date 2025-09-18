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
      try {
        // Check if this is an email confirmation callback
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const type = url.searchParams.get('type');
        
        console.log('Auth callback params:', { code, type, href: window.location.href });
        
        if (type === 'signup' && code) {
          // For email confirmation, we need to use verifyOtp with the correct parameters
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: 'signup'
          });
          
          if (error) {
            console.error('Email verification error:', error);
            throw error;
          }
          
          // Ensure profile row exists after successful confirmation
          const profileResponse = await fetch('/api/profile/ensure', { method: 'POST' });
          if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            console.error('Profile creation failed:', errorData);
            throw new Error('Failed to create profile');
          }
          
          toast.success('Email confirmed');
          router.replace('/provider/onboarding/step-1');
        } else {
          // Handle other auth flows (like OAuth) with exchangeCodeForSession
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
          
          // Ensure profile row exists
          const profileResponse = await fetch('/api/profile/ensure', { method: 'POST' });
          if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            console.error('Profile creation failed:', errorData);
            throw new Error('Failed to create profile');
          }
          
          toast.success('Authentication successful');
          router.replace('/provider/onboarding/step-1');
        }
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


