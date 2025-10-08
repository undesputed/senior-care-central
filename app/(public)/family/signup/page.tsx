"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Chrome, UserPlus, LogIn } from "lucide-react";
import Link from "next/link";

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
          redirectTo: `${window.location.origin}/auth/callback?role=family`
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
    <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: "#c2dacc" }}>
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Create Your Account</CardTitle>
          <CardDescription className="text-gray-600">
            Join thousands of families finding the perfect care for their loved ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-3">
              <LoadingButton
                type="button"
                variant="outline"
                className="w-full"
                onClick={onSignupWithGoogle}
                loading={loading}
                loadingText="Signing up with Google..."
              >
                <Chrome className="h-4 w-4 mr-2" />
                Continue with Google
              </LoadingButton>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={onSignupWithFacebook}
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
                <span className="bg-white px-2 text-muted-foreground">Or sign up with email</span>
              </div>
            </div>

            {/* Full Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                {...register("fullName")}
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <p className="text-sm text-red-600" role="alert">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-red-600" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-red-600" role="alert">{errors.password.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Must be at least 8 characters with 1 uppercase letter and 1 number
              </p>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600" role="alert">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Sign Up Button */}
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Creating account..."
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create Account
            </LoadingButton>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/family/login" className="underline font-medium" style={{ color: "#b4d1be" }}>
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
