"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UserPlus, LogIn } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { createEmailConfirmationRedirectUrl } from "@/lib/auth/redirect-utils";

const schema = z
  .object({
    ownerName: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[0-9]/, "Must include a digit"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

export default function ProviderSignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { owner_name: values.ownerName, role: "provider" },
          emailRedirectTo: createEmailConfirmationRedirectUrl('provider'),
        },
      });
      if (error) {
        if (error.message.toLowerCase().includes("user already registered")) {
          toast.error("This email is already registered. Try signing in instead.");
          return;
        }
        toast.error("Sign up failed", { description: error.message });
        return;
      }
      // Ensure profile row on successful sign-up (session may be null until confirm)
      try { await fetch('/api/profile/ensure', { method: 'POST' }) } catch {}
      toast.success("Check your email to confirm your account.");
      router.replace("/provider/login");
    } finally {
      setLoading(false);
    }
  };

  const onSignupWithGoogle = async () => {
    toast.info("Google sign-up coming soon");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[#71A37A] rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Sign Up</h1>
          <p className="mt-2 text-gray-600">
            Create your agency account to start onboarding
          </p>
        </div>

        {/* Form */}
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
                Agency Owner Name
              </Label>
              <Input 
                id="ownerName" 
                placeholder="Jane Doe" 
                {...register("ownerName")} 
                aria-invalid={!!errors.ownerName}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent"
              />
              {errors.ownerName && (
                <p className="text-sm text-red-600" role="alert">{errors.ownerName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@agency.com" 
                {...register("email")} 
                aria-invalid={!!errors.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent"
              />
              {errors.email && (
                <p className="text-sm text-red-600" role="alert">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                {...register("password")} 
                aria-invalid={!!errors.password}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent"
              />
              {errors.password && (
                <p className="text-sm text-red-600" role="alert">{errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                {...register("confirmPassword")} 
                aria-invalid={!!errors.confirmPassword}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600" role="alert">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Creating account..."
              className="w-full bg-[#71A37A] hover:bg-[#5a8a5a] text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create account
            </LoadingButton>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" 
              onClick={onSignupWithGoogle}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign up with Google
            </Button>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/provider/login" className="text-[#71A37A] hover:text-[#5a8a5a] font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


