"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

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
        existing.forEach((row: { service_id: string }) => { map[row.service_id] = true; });
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
      <div className="flex flex-col items-center gap-4">
        <div className="space-y-2" style={{ width: '358px' }}>
          <p className="text-sm text-muted-foreground">Agency selects the types of care they provide.</p>
        </div>
        <div className="grid gap-3" style={{ width: '358px' }}>
          {services.map((s) => (
            <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" style={{ borderRadius: '8px' }}>
              <Checkbox 
                id={s.slug} 
                checked={!!selected[s.id]} 
                onCheckedChange={(v) => toggle(s.id, Boolean(v))}
                className="data-[state=checked]:bg-[#71A37A] data-[state=checked]:border-[#71A37A]"
              />
              <span className="text-sm">{s.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div
        role="separator"
        aria-orientation="horizontal"
        className="w-full my-4"
        style={{
          borderBottom: '1px solid #E8E8E8',
          width: '358px',
          margin: '0 auto'
        }}
      ></div>
      <div className="flex flex-col items-center space-y-4 pt-6">
        <button
          type="button"
          onClick={onSaveNext}
          disabled={saving || selectedIds.length === 0}
          className="text-white font-medium flex items-center justify-center hover:opacity-90 disabled:opacity-50"
          style={{ 
            backgroundColor: '#71A37A',
            width: '358px',
            height: '54px',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          {saving ? 'Saving...' : 'NEXT →'}
        </button>
        <button
          type="button"
          onClick={() => window.location.href = '/provider/onboarding/step-1'}
          disabled={saving}
          className="text-white font-medium flex items-center justify-center hover:opacity-90 disabled:opacity-50"
          style={{ 
            backgroundColor: '#ffffff',
            color: '#000000',
            width: '358px',
            height: '54px',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #E8E8E8'
          }}
        >
          BACK
        </button>
      </div>
    </div>
  );
}


