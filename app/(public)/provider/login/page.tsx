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
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/provider/reset-password` : undefined,
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
    <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: "#c2dacc" }}>
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Provider Login</CardTitle>
          <CardDescription>Access your agency dashboard to manage referrals.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                  aria-label="Email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={onForgotPassword} className="underline" style={{ color: "#b4d1be" }}>
                Forgot password?
              </button>
              <button type="button" onClick={onResendVerification} className="underline" style={{ color: "#b4d1be" }}>
                Resend verification
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: "#9bc3a2" }}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              <span className="ml-2">Login</span>
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={onLoginWithGoogle}>
              <LogIn className="h-4 w-4" />
              <span className="ml-2">Login with Google</span>
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/provider/signup" className="underline" style={{ color: "#b4d1be" }}>
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


