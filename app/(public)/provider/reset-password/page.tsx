"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createPasswordResetRedirectUrl } from "@/lib/auth/redirect-utils";

export default function ProviderResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: createPasswordResetRedirectUrl('provider'),
      });

      if (error) {
        toast.error("Failed to send reset email", { description: error.message });
        return;
      }

      setSuccess(true);
      toast.success("Reset email sent successfully!");
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-[#71A37A] rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Check Your Email</h1>
            <p className="mt-2 text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-[#71A37A] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">1</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Check your email inbox for a message from us
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-[#71A37A] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">2</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Click the reset link in the email
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-[#71A37A] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">3</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Create your new password
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The reset link will expire in 1 hour for security reasons.
              </p>
            </div>
          </div>

          {/* Back to Sign In */}
          <div className="text-center">
            <Link 
              href="/provider/login" 
              className="inline-flex items-center text-[#71A37A] hover:text-[#5a8a5a] font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
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
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent"
              />
            </div>

            <LoadingButton
              type="submit"
              loading={loading}
              className="w-full bg-[#71A37A] hover:bg-[#5a8a5a] text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </LoadingButton>
          </form>
        </div>

        {/* Back to Sign In */}
        <div className="text-center">
          <Link 
            href="/provider/login" 
            className="inline-flex items-center text-[#71A37A] hover:text-[#5a8a5a] font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}


