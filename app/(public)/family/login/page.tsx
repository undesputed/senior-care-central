"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Chrome, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";

export default function FamilyLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please check your email and click the confirmation link before signing in.");
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        // Ensure profile exists and set role to family
        const response = await fetch('/api/profile/ensure', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'family' })
        });
        
        if (!response.ok) {
          throw new Error('Failed to ensure profile');
        }

        toast.success("Welcome back! Redirecting...");
        router.replace("/family/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onLoginWithGoogle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=family`
        }
      });

      if (error) {
        toast.error("Google sign-in failed. Please try again.");
      }
    } catch (err) {
      toast.error("Google sign-in failed. Please check your browser settings or try again.");
    } finally {
      setLoading(false);
    }
  };

  const onLoginWithFacebook = () => {
    toast.info("Facebook login coming soon!");
  };

  const onResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error("Failed to resend verification email.");
      } else {
        toast.success("Verification email sent! Please check your inbox.");
      }
    } catch (err) {
      toast.error("Failed to resend verification email.");
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: "#c2dacc" }}>
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Sign In to Your Account</CardTitle>
          <CardDescription className="text-gray-600">
            Access your family dashboard to find the right care for your loved ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-3">
              <LoadingButton
                type="button"
                variant="outline"
                className="w-full"
                onClick={onLoginWithGoogle}
                loading={loading}
                loadingText="Signing in with Google..."
              >
                <Chrome className="h-4 w-4 mr-2" />
                Continue with Google
              </LoadingButton>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={onLoginWithFacebook}
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                  aria-label="Email"
                />
              </div>
            </div>

            {/* Password Input */}
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
                {error.includes("Email not confirmed") && (
                  <div className="mt-2">
                    <button type="button" onClick={onResendVerification} className="underline" style={{ color: "#b4d1be" }}>
                      Resend verification
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Login Button */}
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Signing in..."
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </LoadingButton>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link href="/family/reset-password" className="text-sm underline" style={{ color: "#b4d1be" }}>
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/family/signup" className="underline font-medium" style={{ color: "#b4d1be" }}>
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
