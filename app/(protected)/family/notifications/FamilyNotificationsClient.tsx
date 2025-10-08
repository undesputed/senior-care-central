"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  title: string;
  body: string;
  severity: 'info'|'success'|'warning'|'error';
  created_at: string;
}

export default function FamilyNotificationsClient() {
  const supabase = createClient();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('id,title,body,severity,created_at,is_read')
        .eq('role','family')
        .order('created_at', { ascending: false });
      const rows = (data || []) as any;
      setItems(rows);
      setUnread(rows.filter((r: any)=>!r.is_read).length);
      setLoading(false);
    };
    run();
  }, [supabase]);

  const color = (s: string) => s === 'error' ? 'bg-red-100 border-red-300' : 'bg-green-50 border-green-300';
  const dot = (s: string) => s === 'error' ? 'bg-red-600' : 'bg-green-600';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-center mb-6">Notifications {unread>0 && <span className="ml-2 text-sm bg-green-600 text-white rounded-full px-2">{unread}</span>}</h1>
      <div className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-600 text-center">No notifications yet.</p>
        ) : items.map((n) => (
          <button onClick={async ()=>{
            await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
            setItems(prev=>prev.map(p=>p.id===n.id?{...p,is_read:true} as any:p));
            setUnread(prev=>Math.max(0, prev-1));
          }} key={n.id} className={`w-full text-left rounded-lg border ${color(n.severity)} p-4`}> 
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${dot(n.severity)}`} />
                <span className="text-sm text-gray-600">Contract Update</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
            </div>
            <p className="font-medium text-gray-900">{n.title}</p>
            <p className="text-gray-700 text-sm">{n.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}


