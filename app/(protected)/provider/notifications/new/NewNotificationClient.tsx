"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function NewNotificationClient() {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<'info'|'success'|'warning'|'error'>('success');
  const [agencyId, setAgencyId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user?.id)
        .single();
      setAgencyId(agency?.id || "");
    };
    load();
  }, [supabase]);

  const handleCreate = async () => {
    await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'provider', agencyId, title, body, severity })
    });
    window.location.href = '/provider/notifications';
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Notification</h1>
      <div className="space-y-3">
        <Input placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <Textarea placeholder="Message" value={body} onChange={(e)=>setBody(e.target.value)} />
        <div className="flex gap-2">
          {(['success','info','warning','error'] as const).map(s => (
            <button key={s} onClick={()=>setSeverity(s)} className={`px-3 py-1 rounded border ${severity===s?'bg-green-600 text-white':'bg-white'}`}>{s}</button>
          ))}
        </div>
        <Button onClick={handleCreate} disabled={!title || !body || !agencyId}>Create</Button>
      </div>
    </div>
  );
}


