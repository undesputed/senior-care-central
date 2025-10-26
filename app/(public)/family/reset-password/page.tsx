"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createPasswordResetRedirectUrl } from "@/lib/auth/redirect-utils";

export default function FamilyResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: createPasswordResetRedirectUrl('family'),
      });

      if (error) {
        toast.error("Failed to send reset email. Please try again.");
        return;
      }

      setEmailSent(true);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (err) {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-white">
        {/* Logo and Title Section */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"/>
              </svg>
            </div>
          </div>
          
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 text-sm leading-relaxed">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        {/* Instructions */}
        <div className="w-full max-w-sm mb-6">
          <div className="text-sm text-gray-600 space-y-2">
            <p>If you don't see the email in your inbox:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes for the email to arrive</li>
              <li><strong>Important:</strong> The reset link expires in 1 hour, so please check your email soon</li>
            </ul>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            className="w-full h-12 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
          >
            Try Different Email
          </Button>
          
          <Link href="/family/login" className="block">
            <Button 
              variant="outline" 
              className="w-full h-12 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-white">
      {/* Logo and Title Section */}
      <div className="text-center mb-8">
        {/* Logo */}
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"/>
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 text-sm leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Reset Password Form */}
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        {/* Email Input */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 border border-gray-300 rounded-lg pl-10"
            required
            autoComplete="email"
            aria-label="Email address"
          />
        </div>

        {/* Send Reset Email Button */}
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Sending reset email..."
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
        >
          SEND RESET EMAIL
          <ArrowRight className="h-4 w-4 ml-2" />
        </LoadingButton>
      </form>

      {/* Back to Login Link */}
      <div className="mt-6 text-center">
        <Link href="/family/login" className="inline-block">
          <Button 
            variant="outline" 
            className="h-12 px-8 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
