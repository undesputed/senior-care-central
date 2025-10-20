"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const supabase = createClient();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      // Supabase does not require old password for update with a logged-in session
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 mt-4 mb-6">
          <Link href="/family/profile/account" className="inline-flex items-center text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back to Profile
          </Link>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Change Password</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Old password</label>
            <Input type="password" value={oldPassword} onChange={(e)=>setOldPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Enter new password</label>
            <Input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Repeat password</label>
            <Input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Updating..." : "CHANGE PASSWORD"}
          </Button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  );
}


