"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
      const svcRows = (selected ?? []).map((row: unknown) => {
        const r = row as { service_id: string; services: { name: string } };
        return { 
          id: r.service_id, 
          name: r.services?.name || 'Unknown Service' 
        };
      });
      setServices(svcRows);
      if (existing && existing.length > 0) {
        // pick the last pricing_format as current selection
        setFormat((existing[0].pricing_format as PricingFormat) ?? 'hourly');
        const v: Record<string, { min: string; max: string }> = {};
        existing.forEach((r: { service_id: string; min_amount: number | null; max_amount: number | null }) => {
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 rounded-lg" style={{width: '600px' }}>
        <div className="space-y-6">
          {/* Pricing Format Selection */}
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: '#666666' }}>Choose pricing format(s):</p>
            <div className="flex border rounded-lg overflow-hidden" style={{ border: '1px solid #9BC3A2' }}>
              <button
                type="button"
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  format === 'hourly' 
                    ? 'text-white' 
                    : 'text-gray-600'
                }`}
                style={{
                  backgroundColor: format === 'hourly' ? '#71A37A' : '#F5F5F5',
                  borderRadius: format === 'hourly' ? '8px 0 0 8px' : '0',
                }}
                onClick={() => setFormat('hourly')}
                aria-pressed={format === 'hourly'}
              >
                Hourly
              </button>
              <button
                type="button"
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  format === 'monthly' 
                    ? 'text-white' 
                    : 'text-gray-600'
                }`}
                style={{
                  backgroundColor: format === 'monthly' ? '#71A37A' : '#F5F5F5',
                  borderRadius: format === 'monthly' ? '0 8px 8px 0' : '0',
                }}
                onClick={() => setFormat('monthly')}
                aria-pressed={format === 'monthly'}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Service Rate Input Fields */}
          <div className="space-y-4">
            {services.map((s) => {
              const v = values[s.id] ?? { min: '', max: '' };
              return (
                <div key={s.id} className="space-y-3">
                  <div className="text-sm font-medium" style={{ color: '#333333' }}>
                    {s.name} <span className="text-red-500">*</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Input 
                        id={`min-${s.id}`} 
                        inputMode="decimal" 
                        placeholder="Min" 
                        value={v.min} 
                        onChange={(e) => setField(s.id, 'min', e.target.value)}
                        style={{
                          width: '100%',
                          height: '48px',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          border: '1px solid #E8E8E8',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Input 
                        id={`max-${s.id}`} 
                        inputMode="decimal" 
                        placeholder="Max" 
                        value={v.max} 
                        onChange={(e) => setField(s.id, 'max', e.target.value)}
                        style={{
                          width: '100%',
                          height: '48px',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          border: '1px solid #E8E8E8',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col space-y-3 pt-4">
            <button
              type="button"
              onClick={onSaveNext}
              disabled={saving}
              className="text-white font-medium flex items-center justify-center hover:opacity-90 disabled:opacity-50"
              style={{ 
                backgroundColor: '#71A37A',
                width: '100%',
                height: '54px',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              {saving ? 'Saving...' : 'NEXT →'}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/provider/onboarding/step-3'}
              disabled={saving}
              className="font-medium flex items-center justify-center hover:opacity-90 disabled:opacity-50"
              style={{ 
                backgroundColor: '#ffffff',
                color: '#333333',
                width: '100%',
                height: '54px',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #E8E8E8'
              }}
            >
              SAVE & EXIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


