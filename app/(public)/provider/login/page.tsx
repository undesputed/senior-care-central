"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Loader2, LogIn } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { createPasswordResetRedirectUrl } from "@/lib/auth/redirect-utils";

export default function ProviderLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted && session?.user) {
        router.replace("/provider/dashboard");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          toast.error("Please verify your email to continue.", { description: "We can resend the confirmation email." });
          return;
        }
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          toast.error("Invalid email or password");
          return;
        }
        toast.error("Login failed", { description: error.message });
        return;
      }
      // Ensure profile row exists
      await fetch('/api/profile/ensure', { method: 'POST' })
      
      // Check onboarding completion and redirect accordingly
      const onboardingCheck = await fetch('/api/onboarding/check', { method: 'POST' })
      const { isComplete, nextStep } = await onboardingCheck.json()
      
      if (isComplete) {
        toast.success("Welcome back! Redirecting...");
        router.replace("/provider/dashboard");
      } else {
        toast.success("Welcome! Let's complete your setup.");
        router.replace(nextStep || "/provider/onboarding/step-1");
      }
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email to reset password");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: createPasswordResetRedirectUrl('provider'),
    });
    if (error) {
      toast.error("Could not send reset email", { description: error.message });
      return;
    }
    toast.success("Password reset email sent");
  };

  const onResendVerification = async () => {
    if (!email) {
      toast.error("Enter your email to resend verification");
      return;
    }
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast.error("Could not resend verification", { description: error.message });
      return;
    }
    toast.success("Verification email resent");
  };

  const onLoginWithGoogle = async () => {
    toast.info("Google login coming soon");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[#71A37A] rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Login</h1>
          <p className="mt-2 text-gray-600">
            Access your agency dashboard to manage referrals
          </p>
        </div>

        {/* Form */}
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent"
                  required
                  autoComplete="email"
                  aria-label="Email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent"
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link href="/provider/reset-password" className="text-[#71A37A] hover:text-[#5a8a5a] font-medium">
                Forgot password?
              </Link>
              <button 
                type="button" 
                onClick={onResendVerification} 
                className="text-[#71A37A] hover:text-[#5a8a5a] font-medium"
              >
                Resend verification
              </button>
            </div>

            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Signing in..."
              className="w-full bg-[#71A37A] hover:bg-[#5a8a5a] text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </LoadingButton>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" 
              onClick={onLoginWithGoogle}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login with Google
            </Button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link href="/provider/signup" className="text-[#71A37A] hover:text-[#5a8a5a] font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


