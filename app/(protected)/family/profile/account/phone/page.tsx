"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePhonePage() {
  const supabase = createClient();
  const [currentPhone, setCurrentPhone] = useState<string>("");
  const [newPhone, setNewPhone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('families')
        .select('phone, phone_number')
        .eq('user_id', user.id)
        .maybeSingle();
      setCurrentPhone(data?.phone || data?.phone_number || "");
    })();
  }, [supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('families')
        .update({ phone: newPhone, phone_number: newPhone })
        .eq('user_id', user.id);
      if (error) throw error;
      setMessage('Phone updated successfully.');
      setCurrentPhone(newPhone);
      setNewPhone("");
    } catch (err: any) {
      setMessage(err.message || 'Failed to update phone');
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
          <h1 className="text-2xl font-semibold text-gray-900">Change Phone</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Current phone</label>
            <Input value={currentPhone} readOnly />
          </div>
          <div>
            <Input
              placeholder="Enter your new phone number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? 'Updating...' : 'CHANGE'}
          </Button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  );
}


