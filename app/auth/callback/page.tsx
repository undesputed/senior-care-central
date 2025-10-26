"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [status, setStatus] = useState<string>("Processing confirmation...");

  useEffect(() => {
    (async () => {
      // Check for error parameters in URL first
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorCode = urlParams.get('error_code');
      const errorDescription = urlParams.get('error_description');
      const type = urlParams.get('type');
      
      // Debug logging
      console.log('Auth callback URL:', window.location.href);
      console.log('URL params:', Object.fromEntries(urlParams.entries()));
      console.log('Search params:', Object.fromEntries(params.entries()));
      
      if (error === 'access_denied' && errorCode === 'otp_expired') {
        setStatus('This password reset link has expired. Password reset links are only valid for 1 hour. Please request a new one.');
        toast.error('Password reset link expired');
        setTimeout(() => {
          const role = params.get('role');
          
          // Check the redirect_to URL to determine the role if not explicitly provided
          const redirectTo = urlParams.get('redirect_to') || '';
          let determinedRole = role;
          
          if (!determinedRole) {
            if (redirectTo.includes('/family/')) {
              determinedRole = 'family';
            } else if (redirectTo.includes('/provider/')) {
              determinedRole = 'provider';
            } else {
              // Default to provider if we can't determine
              determinedRole = 'provider';
            }
          }
          
          router.replace(determinedRole === 'family' ? '/family/reset-password' : '/provider/reset-password');
        }, 3000);
        return;
      }
      
      // Handle password reset or email confirmation
      try {
        console.log('Processing auth callback...');
        console.log('Full URL:', window.location.href);
        
        // Get additional URL parameters
        const token = urlParams.get('token');
        const code = urlParams.get('code');
        
        console.log('Token:', token);
        console.log('Code:', code);
        console.log('Type:', type);
        
        let exchangeResult;
        
        if (token && type === 'recovery') {
          // This is a password reset flow - we need to handle it differently
          console.log('Handling password reset flow...');
          
          // For password reset, we need to verify the token and create a session
          // The token should be exchanged for a session using the token directly
          const { data, error: tokenError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          
          if (tokenError) {
            console.error('Token verification error:', tokenError);
            throw tokenError;
          }
          
          console.log('Token verified successfully:', data);
          exchangeResult = { error: null };
        } else if (code) {
          // This is an email confirmation flow
          console.log('Handling email confirmation flow...');
          exchangeResult = await supabase.auth.exchangeCodeForSession(window.location.href);
        } else {
          // Try the general exchange method as fallback
          console.log('Trying general exchange method...');
          exchangeResult = await supabase.auth.exchangeCodeForSession(window.location.href);
        }
        
        const { error: exchangeError } = exchangeResult;
        if (exchangeError) {
          console.error('Exchange error:', exchangeError);
          console.error('Error message:', exchangeError.message);
          console.error('Error code:', exchangeError.status);
          
          // Handle specific error cases
          if (exchangeError.message.includes('expired') || 
              exchangeError.message.includes('invalid') || 
              exchangeError.message.includes('otp_expired') ||
              exchangeError.message.includes('access_denied')) {
            setStatus('This password reset link has expired. Password reset links are only valid for 1 hour. Please request a new one.');
            toast.error('Password reset link expired');
            setTimeout(() => {
              const role = params.get('role');
              const type = params.get('type');
              
              // Check the redirect_to URL to determine the role if not explicitly provided
              const redirectTo = urlParams.get('redirect_to') || '';
              let determinedRole = role;
              
              if (!determinedRole) {
                if (redirectTo.includes('/family/')) {
                  determinedRole = 'family';
                } else if (redirectTo.includes('/provider/')) {
                  determinedRole = 'provider';
                } else {
                  // Default to provider if we can't determine
                  determinedRole = 'provider';
                }
              }
              
              if (type === 'recovery') {
                // Redirect to reset password page for expired recovery links
                router.replace(determinedRole === 'family' ? '/family/reset-password' : '/provider/reset-password');
              } else {
                router.replace(determinedRole === 'family' ? '/family/login' : '/provider/login');
              }
            }, 3000);
            return;
          }
          throw exchangeError;
        }
        
        // Small delay to ensure session is properly set in cookies
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if this is a password reset flow
        // urlParams and type are already declared at the top of the function
        
        if (type === 'recovery') {
          // This is a password reset flow
          const role = params.get('role');
          
          // Check the redirect_to URL to determine the role if not explicitly provided
          const redirectTo = urlParams.get('redirect_to') || '';
          let determinedRole = role;
          
          if (!determinedRole) {
            if (redirectTo.includes('/family/update-password')) {
              determinedRole = 'family';
            } else if (redirectTo.includes('/provider/update-password')) {
              determinedRole = 'provider';
            } else {
              // Default to provider if we can't determine
              determinedRole = 'provider';
            }
          }
          
          if (determinedRole === 'family') {
            router.replace('/family/update-password');
          } else {
            router.replace('/provider/update-password');
          }
          return;
        }
        
        // Get role from URL params or default to provider
        const role = params.get('role') || 'provider';
        
        const response = await fetch('/api/profile/ensure', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Profile creation failed');
        }
        
        toast.success('Email confirmed');
        
        // Redirect based on role
        if (role === 'family') {
          router.replace('/family/dashboard');
        } else {
          router.replace('/provider/onboarding/step-1');
        }
      } catch (e: any) {
        console.error('Auth callback error:', e);
        setStatus('Could not complete confirmation. Please sign in.');
        toast.error('Confirmation failed');
        
        // Redirect to appropriate login based on role
        const role = params.get('role');
        
        // Check the redirect_to URL to determine the role if not explicitly provided
        const redirectTo = urlParams.get('redirect_to') || '';
        let determinedRole = role;
        
        if (!determinedRole) {
          if (redirectTo.includes('/family/')) {
            determinedRole = 'family';
          } else if (redirectTo.includes('/provider/')) {
            determinedRole = 'provider';
          } else {
            // Default to provider if we can't determine
            determinedRole = 'provider';
          }
        }
        
        if (determinedRole === 'family') {
          router.replace('/family/login');
        } else {
          router.replace('/provider/login');
        }
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: "#c2dacc" }}>
        <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
          <CardHeader>
            <CardTitle>Email Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}


