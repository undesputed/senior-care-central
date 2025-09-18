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
        const error = url.searchParams.get('error');
        const errorCode = url.searchParams.get('error_code');
        const errorDescription = url.searchParams.get('error_description');
        
        console.log('Auth callback params:', { code, type, error, errorCode, errorDescription, href: window.location.href });
        
        // Handle error cases first
        if (error) {
          console.error('Auth callback error:', { error, errorCode, errorDescription });
          if (errorCode === 'otp_expired') {
            setStatus('Email link has expired. Please request a new confirmation email.');
            toast.error('Email link expired. Please sign up again.');
          } else {
            setStatus(`Authentication failed: ${errorDescription || error}`);
            toast.error('Authentication failed');
          }
          setTimeout(() => router.replace('/provider/login'), 3000);
          return;
        }
        
        // Handle successful email confirmation
        if (type === 'signup' && code) {
          setStatus('Verifying email...');
          
          // For email confirmation, try multiple methods
          let verifyError = null;
          let data = null;
          
          // Method 1: Try verifyOtp with token_hash
          try {
            const result = await supabase.auth.verifyOtp({
              token_hash: code,
              type: 'signup'
            });
            data = result.data;
            verifyError = result.error;
          } catch (e) {
            console.log('verifyOtp with token_hash failed, trying alternative method');
          }
          
          // Method 2: If first method fails, try verifyOtp with token
          if (verifyError) {
            try {
              const result = await supabase.auth.verifyOtp({
                token: code,
                type: 'signup'
              });
              data = result.data;
              verifyError = result.error;
            } catch (e) {
              console.log('verifyOtp with token failed, trying exchangeCodeForSession');
            }
          }
          
          // Method 3: If both verifyOtp methods fail, try exchangeCodeForSession as fallback
          if (verifyError) {
            try {
              const result = await supabase.auth.exchangeCodeForSession(window.location.href);
              data = result.data;
              verifyError = result.error;
            } catch (e) {
              console.log('exchangeCodeForSession also failed');
            }
          }
          
          if (verifyError) {
            console.error('All email verification methods failed:', verifyError);
            setStatus('Email verification failed. Please try again.');
            toast.error('Email verification failed');
            setTimeout(() => router.replace('/provider/login'), 3000);
            return;
          }
          
          setStatus('Creating profile...');
          
          // Ensure profile row exists after successful confirmation
          const profileResponse = await fetch('/api/profile/ensure', { method: 'POST' });
          if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            console.error('Profile creation failed:', errorData);
            setStatus('Profile creation failed. Please contact support.');
            toast.error('Profile creation failed');
            setTimeout(() => router.replace('/provider/login'), 3000);
            return;
          }
          
          setStatus('Email confirmed successfully!');
          toast.success('Email confirmed');
          setTimeout(() => router.replace('/provider/onboarding/step-1'), 1000);
        } else if (code) {
          // Handle other auth flows (like OAuth) with exchangeCodeForSession
          setStatus('Completing authentication...');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setStatus('Authentication failed. Please try again.');
            toast.error('Authentication failed');
            setTimeout(() => router.replace('/provider/login'), 3000);
            return;
          }
          
          setStatus('Creating profile...');
          
          // Ensure profile row exists
          const profileResponse = await fetch('/api/profile/ensure', { method: 'POST' });
          if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            console.error('Profile creation failed:', errorData);
            setStatus('Profile creation failed. Please contact support.');
            toast.error('Profile creation failed');
            setTimeout(() => router.replace('/provider/login'), 3000);
            return;
          }
          
          setStatus('Authentication successful!');
          toast.success('Authentication successful');
          setTimeout(() => router.replace('/provider/onboarding/step-1'), 1000);
        } else {
          // No code or type parameter
          setStatus('Invalid confirmation link. Please try again.');
          toast.error('Invalid confirmation link');
          setTimeout(() => router.replace('/provider/login'), 3000);
        }
      } catch (e: any) {
        console.error('Auth callback error:', e);
        setStatus('An unexpected error occurred. Please try again.');
        toast.error('Confirmation failed');
        setTimeout(() => router.replace('/provider/login'), 3000);
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


