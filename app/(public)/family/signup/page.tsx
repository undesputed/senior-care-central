"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Chrome, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createEmailConfirmationRedirectUrl } from "@/lib/auth/redirect-utils";

const schema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[A-Z])(?=.*\d)/, "Password must contain at least 1 uppercase letter and 1 number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function FamilySignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: 'family'
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (authData.user) {
        // Ensure profile and family record are created
        const response = await fetch('/api/profile/ensure', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            role: 'family',
            full_name: data.fullName
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create profile');
        }

        toast.success("Account created! Please check your email to confirm your account.");
        router.replace("/family/login");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSignupWithGoogle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: createEmailConfirmationRedirectUrl('family')
        }
      });

      if (error) {
        toast.error("Google sign-up failed. Please try again.");
      }
    } catch (err) {
      toast.error("Google sign-up failed. Please check your browser settings or try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSignupWithFacebook = () => {
    toast.info("Facebook sign-up coming soon!");
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Senior Care Central</h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 text-sm leading-relaxed">
          Join thousands of families finding the perfect care for their loved ones.
        </p>
      </div>

      {/* Social Sign-up Buttons */}
      <div className="w-full max-w-sm space-y-3 mb-6">
        <LoadingButton
          type="button"
          variant="outline"
          className="w-full h-12 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
          onClick={onSignupWithGoogle}
          loading={loading}
          loadingText="Signing up with Google..."
        >
          <Chrome className="h-4 w-4 mr-2" />
          Sign up with Google
        </LoadingButton>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full h-12 border border-gray-300 rounded-lg bg-white hover:bg-gray-50" 
          onClick={onSignupWithFacebook}
          disabled={loading}
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Sign up with Facebook
        </Button>
      </div>

      {/* Divider */}
      <div className="relative w-full max-w-sm mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-500">or</span>
        </div>
      </div>

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
        {/* Full Name Input */}
        <div className="relative">
          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            {...register("fullName")}
            className="h-12 border border-gray-300 rounded-lg pl-10"
            aria-invalid={!!errors.fullName}
          />
        </div>
        {errors.fullName && (
          <p className="text-sm text-red-600" role="alert">{errors.fullName.message}</p>
        )}

        {/* Email Input */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            {...register("email")}
            className="h-12 border border-gray-300 rounded-lg pl-10"
            aria-invalid={!!errors.email}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600" role="alert">{errors.email.message}</p>
        )}

        {/* Password Input */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            {...register("password")}
            className="h-12 border border-gray-300 rounded-lg pl-10 pr-10"
            aria-invalid={!!errors.password}
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
        {errors.password && (
          <p className="text-sm text-red-600" role="alert">{errors.password.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Must be at least 8 characters with 1 uppercase letter and 1 number
        </p>

        {/* Confirm Password Input */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            {...register("confirmPassword")}
            className="h-12 border border-gray-300 rounded-lg pl-10 pr-10"
            aria-invalid={!!errors.confirmPassword}
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
        {errors.confirmPassword && (
          <p className="text-sm text-red-600" role="alert">{errors.confirmPassword.message}</p>
        )}

        {/* Sign Up Button */}
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Creating account..."
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
        >
          CREATE ACCOUNT
          <ArrowRight className="h-4 w-4 ml-2" />
        </LoadingButton>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-3">Already have an account?</p>
        <Link href="/family/login" className="inline-block">
          <Button 
            variant="outline" 
            className="h-12 px-8 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
          >
            LOGIN
          </Button>
        </Link>
      </div>
    </div>
  );
}
