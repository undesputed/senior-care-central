"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function FamilyUpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // First, try to get the current session
        let { data: { session } } = await supabase.auth.getSession();
        
        // If no session, try to exchange the code from the URL
        if (!session) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            console.error("Session exchange error:", error);
            toast.error("Invalid or expired reset link. Please request a new password reset.");
            router.replace("/family/reset-password");
            return;
          }
          session = data.session;
        }
        
        if (!session) {
          toast.error("Invalid or expired reset link. Please request a new password reset.");
          router.replace("/family/reset-password");
          return;
        }
        
        setIsValidSession(true);
      } catch (error) {
        console.error("Session check error:", error);
        toast.error("Invalid or expired reset link. Please request a new password reset.");
        router.replace("/family/reset-password");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [supabase.auth, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords don't match. Please try again.");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (!/(?=.*[A-Z])(?=.*\d)/.test(password)) {
      toast.error("Password must contain at least 1 uppercase letter and 1 number.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) {
        toast.error("Could not update password. Please try again.");
        return;
      }

      setPasswordUpdated(true);
      toast.success("Password updated successfully!");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.replace("/family/login");
      }, 2000);
    } catch (err) {
      toast.error("Could not update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Senior Care Central</h1>
          <p className="text-gray-600">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return null; // Will redirect
  }

  if (passwordUpdated) {
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
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Updated!</h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 text-sm leading-relaxed">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
        </div>

        {/* Redirect Message */}
        <div className="w-full max-w-sm mb-6">
          <div className="text-sm text-gray-600 text-center">
            <p>Redirecting you to the sign in page...</p>
          </div>
        </div>
        
        {/* Manual Login Button */}
        <div className="w-full max-w-sm">
          <Link href="/family/login" className="block">
            <Button 
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
            >
              Go to Sign In
              <ArrowRight className="h-4 w-4 ml-2" />
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Update Your Password</h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 text-sm leading-relaxed">
          Enter your new password below to complete the reset process.
        </p>
      </div>

      {/* Update Password Form */}
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        {/* New Password Input */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 border border-gray-300 rounded-lg pl-10 pr-10"
            required
            autoComplete="new-password"
            aria-label="New password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Confirm Password Input */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 border border-gray-300 rounded-lg pl-10 pr-10"
            required
            autoComplete="new-password"
            aria-label="Confirm new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Password Requirements */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>Password requirements:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>At least 8 characters long</li>
            <li>Contains at least 1 uppercase letter</li>
            <li>Contains at least 1 number</li>
          </ul>
        </div>

        {/* Update Password Button */}
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Updating password..."
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
        >
          UPDATE PASSWORD
          <ArrowRight className="h-4 w-4 ml-2" />
        </LoadingButton>
      </form>

      {/* Back to Login Link */}
      <div className="mt-6 text-center">
        <Link href="/family/login" className="text-sm text-gray-600 underline hover:text-gray-800">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
