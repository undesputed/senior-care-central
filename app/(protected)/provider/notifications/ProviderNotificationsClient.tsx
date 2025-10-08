"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  body: string;
  severity: 'info'|'success'|'warning'|'error';
  created_at: string;
}

export default function ProviderNotificationsClient() {
  const supabase = createClient();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!agency) { setItems([]); setLoading(false); return; }

      const { data } = await supabase
        .from('notifications')
        .select('id,title,body,severity,created_at')
        .eq('role','provider')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      setItems((data || []) as any);
      setLoading(false);
    };
    run();
  }, [supabase]);

  const color = (s: string) => s === 'error' ? 'bg-red-100 border-red-300' : 'bg-green-50 border-green-300';
  const dot = (s: string) => s === 'error' ? 'bg-red-600' : 'bg-green-600';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Link href="/provider/notifications/new" className="text-green-700 text-sm">Create notification</Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-600">No notifications yet.</p>
        ) : items.map((n) => (
          <div key={n.id} className={`rounded-lg border ${color(n.severity)} p-4`}> 
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${dot(n.severity)}`} />
                <span className="text-sm text-gray-600">Contract Update</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
            </div>
            <p className="font-medium text-gray-900">{n.title}</p>
            <p className="text-gray-700 text-sm">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


