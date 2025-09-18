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
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
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
    <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: "#c2dacc" }}>
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg" style={{ backgroundColor: "#ffffff" }}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Provider Sign Up</CardTitle>
          <CardDescription>Create your agency account to start onboarding.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Agency Owner Name</Label>
              <Input id="ownerName" placeholder="Jane Doe" {...register("ownerName")} aria-invalid={!!errors.ownerName} />
              {errors.ownerName && (
                <p className="text-sm text-red-600" role="alert">{errors.ownerName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@agency.com" {...register("email")} aria-invalid={!!errors.email} />
              {errors.email && (
                <p className="text-sm text-red-600" role="alert">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} aria-invalid={!!errors.password} />
              {errors.password && (
                <p className="text-sm text-red-600" role="alert">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600" role="alert">{errors.confirmPassword.message}</p>
              )}
            </div>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Creating account..."
              className="w-full"
              style={{ backgroundColor: "#9bc3a2" }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create account
            </LoadingButton>
            <Button type="button" variant="outline" className="w-full" onClick={onSignupWithGoogle}>
              <LogIn className="h-4 w-4" />
              <span className="ml-2">Sign up with Google</span>
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/provider/login" className="underline" style={{ color: "#b4d1be" }}>
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


