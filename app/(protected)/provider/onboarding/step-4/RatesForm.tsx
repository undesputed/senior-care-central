"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

type PricingFormat = 'hourly' | 'monthly';

interface ServiceRow { id: string; name: string }

export default function RatesForm() {
  const supabase = createClient();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [format, setFormat] = useState<PricingFormat>('hourly');
  const [values, setValues] = useState<Record<string, { min: string; max: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agency } = await supabase.from('agencies').select('id').eq('owner_id', user.id).maybeSingle();
      if (!agency) return;
      const [{ data: selected }, { data: existing }] = await Promise.all([
        supabase
          .from('agency_services')
          .select('service_id, services(name)')
          .eq('agency_id', agency.id)
          .order('service_id'),
        supabase
          .from('agency_service_rates')
          .select('service_id, pricing_format, min_amount, max_amount')
          .eq('agency_id', agency.id)
      ]);
      const svcRows = (selected ?? []).map((row: any) => ({ id: row.service_id, name: row.services.name }));
      setServices(svcRows);
      if (existing && existing.length > 0) {
        // pick the last pricing_format as current selection
        setFormat((existing[0].pricing_format as PricingFormat) ?? 'hourly');
        const v: Record<string, { min: string; max: string }> = {};
        existing.forEach((r: any) => {
          v[r.service_id] = {
            min: r.min_amount != null ? String(r.min_amount) : '',
            max: r.max_amount != null ? String(r.max_amount) : '',
          };
        });
        setValues(v);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (serviceId: string, key: 'min' | 'max', val: string) => {
    setValues((prev) => ({ ...prev, [serviceId]: { ...(prev[serviceId] ?? { min: '', max: '' }), [key]: val } }));
  };

  const validateNumber = (s: string) => s === '' || (/^\d+(\.\d{1,2})?$/.test(s) && Number(s) >= 0 && Number(s) <= 99999);

  const onSaveNext = async () => {
    // Validate ranges
    for (const s of services) {
      const v = values[s.id] ?? { min: '', max: '' };
      if (!validateNumber(v.min) || !validateNumber(v.max)) {
        toast.error('Invalid price format');
        return;
      }
      if (v.min !== '' && v.max !== '' && Number(v.min) > Number(v.max)) {
        toast.error('Min cannot exceed Max');
        return;
      }
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: agency } = await supabase.from('agencies').select('id').eq('owner_id', user.id).maybeSingle();
    if (!agency) { setSaving(false); return; }

    // Clear and insert
    const { error: delErr } = await supabase.from('agency_service_rates').delete().eq('agency_id', agency.id);
    if (delErr) { setSaving(false); toast.error('Failed to save', { description: delErr.message }); return; }

    const rows = services.map((s) => {
      const v = values[s.id] ?? { min: '', max: '' };
      return {
        agency_id: agency.id,
        service_id: s.id,
        pricing_format: format,
        min_amount: v.min === '' ? null : Number(v.min),
        max_amount: v.max === '' ? null : Number(v.max),
        currency: 'USD',
      };
    });
    const { error: insErr } = await supabase.from('agency_service_rates').insert(rows);
    setSaving(false);
    if (insErr) { toast.error('Failed to save', { description: insErr.message }); return; }
    toast.success('Rates saved');
    window.location.href = '/provider/onboarding/step-5';
  };

  if (services.length === 0) return <p>Select services in Step 2 first.</p>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button
          type="button"
          className={`px-3 py-1 rounded ${format === 'hourly' ? 'bg-[#9bc3a2] text-white' : 'bg-[#d1eee4]'}`}
          onClick={() => setFormat('hourly')}
          aria-pressed={format === 'hourly'}
        >Hourly</button>
        <button
          type="button"
          className={`px-3 py-1 rounded ${format === 'monthly' ? 'bg-[#9bc3a2] text-white' : 'bg-[#d1eee4]'}`}
          onClick={() => setFormat('monthly')}
          aria-pressed={format === 'monthly'}
        >Monthly</button>
      </div>

      <div className="grid gap-4">
        {services.map((s) => {
          const v = values[s.id] ?? { min: '', max: '' };
          return (
            <div key={s.id} className="grid gap-2">
              <div className="font-medium">{s.name} <span className="text-red-500">*</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`min-${s.id}`}>Min</Label>
                  <Input id={`min-${s.id}`} inputMode="decimal" placeholder="100" value={v.min} onChange={(e) => setField(s.id, 'min', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor={`max-${s.id}`}>Max</Label>
                  <Input id={`max-${s.id}`} inputMode="decimal" placeholder="250" value={v.max} onChange={(e) => setField(s.id, 'max', e.target.value)} />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Range: $100 – $99,999. Leave blank for "Contact for pricing".</div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">* Provide rates for at least one service</p>

      <div className="flex items-center justify-between">
        <Link href="/provider/onboarding/step-3" className="underline">Back</Link>
        <Button onClick={onSaveNext} disabled={saving} style={{ backgroundColor: "#9bc3a2" }}>Next</Button>
      </div>
    </div>
  );
}


