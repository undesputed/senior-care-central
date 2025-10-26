"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Lock, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ProviderUpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionChecked, setSessionChecked] = useState(false);

  // Check for session and handle URL parameters
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          toast.error("Session error. Please try the reset link again.");
          router.push("/provider/reset-password");
          return;
        }

        // If no session, try to exchange code from URL
        if (!session) {
          const urlParams = new URLSearchParams(window.location.search);
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { data, error: exchangeError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (exchangeError) {
              console.error("Session exchange error:", exchangeError);
              toast.error("Invalid or expired reset link. Please request a new one.");
              router.push("/provider/reset-password");
              return;
            }
          } else {
            // Try to exchange code from URL directly
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
            
            if (exchangeError) {
              console.error("Code exchange error:", exchangeError);
              toast.error("Invalid or expired reset link. Please request a new one.");
              router.push("/provider/reset-password");
              return;
            }
          }
        }
        
        setSessionChecked(true);
      } catch (error) {
        console.error("Error checking session:", error);
        toast.error("An error occurred. Please try again.");
        router.push("/provider/reset-password");
      }
    };

    checkSession();
  }, [supabase, router]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const validation = passwordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) {
        toast.error("Failed to update password", { description: error.message });
        return;
      }

      setSuccess(true);
      toast.success("Password updated successfully!");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/provider/login");
      }, 3000);
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#71A37A] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Success Icon and Title */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Password Updated!</h1>
            <p className="mt-2 text-gray-600">
              Your password has been successfully updated. You will be redirected to the login page shortly.
            </p>
          </div>

          {/* Redirect Info */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-4">
              You can now sign in with your new password.
            </p>
            <Link 
              href="/provider/login" 
              className="inline-flex items-center text-[#71A37A] hover:text-[#5a8a5a] font-medium"
            >
              Go to Sign In
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[#71A37A] rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Password</h1>
          <p className="mt-2 text-gray-600">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <LoadingButton
              type="submit"
              loading={loading}
              className="w-full bg-[#71A37A] hover:bg-[#5a8a5a] text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? "Updating..." : "Update Password"}
            </LoadingButton>
          </form>
        </div>

        {/* Back to Reset Password */}
        <div className="text-center">
          <Link 
            href="/provider/reset-password" 
            className="inline-flex items-center text-[#71A37A] hover:text-[#5a8a5a] font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reset Password
          </Link>
        </div>
      </div>
    </div>
  );
}
