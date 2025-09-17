"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

interface ServiceRow { id: string; slug: string; name: string }

export default function ServicesForm() {
  const supabase = createClient();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // First get the agency ID
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (!agency) {
        setLoading(false);
        return;
      }
      
      // Then get services and existing selections
      const [{ data: svc }, { data: existing }] = await Promise.all([
        supabase.from('services').select('id,slug,name').order('name'),
        supabase.from('agency_services').select('service_id').eq('agency_id', agency.id)
      ]);
      
      if (svc) setServices(svc);
      if (existing) {
        const map: Record<string, boolean> = {};
        existing.forEach((row: any) => { map[row.service_id] = true; });
        setSelected(map);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  const onSaveNext = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one service you offer.");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: agency } = await supabase.from('agencies').select('id').eq('owner_id', user.id).maybeSingle();
    if (!agency) {
      setSaving(false);
      toast.error("No agency found");
      return;
    }
    // Upsert selections: clear then insert
    const { error: delErr } = await supabase.from('agency_services').delete().eq('agency_id', agency.id);
    if (delErr) {
      setSaving(false);
      toast.error("Failed to save selections", { description: delErr.message });
      return;
    }
    const rows = selectedIds.map((sid) => ({ agency_id: agency.id, service_id: sid }));
    const { error: insErr } = await supabase.from('agency_services').insert(rows);
    setSaving(false);
    if (insErr) {
      toast.error("Failed to save selections", { description: insErr.message });
      return;
    }
    toast.success("Services saved");
    window.location.href = '/provider/onboarding/step-3';
  };

  if (loading) return <p>Loading services...</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {services.map((s) => (
          <label key={s.id} className="flex items-center gap-3">
            <Checkbox id={s.slug} checked={!!selected[s.id]} onCheckedChange={(v) => toggle(s.id, Boolean(v))} />
            <span>{s.name} <span className="text-red-500">*</span></span>
          </label>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">* Select at least one service</p>
      <div className="flex items-center justify-between">
        <Link href="/provider/onboarding/step-1" className="underline">Back</Link>
        <Button onClick={onSaveNext} disabled={saving} style={{ backgroundColor: "#9bc3a2" }}>Next</Button>
      </div>
    </div>
  );
}


