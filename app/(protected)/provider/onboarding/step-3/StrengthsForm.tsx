"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/ui/star-rating";
import { toast } from "sonner";

interface ServiceRow { id: string; name: string }

export default function StrengthsForm() {
  const supabase = createClient();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [points, setPoints] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const MAX_TOTAL = 20;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agency } = await supabase.from('agencies').select('id').eq('owner_id', user.id).maybeSingle();
      if (!agency) return;
      const [{ data: selected }, { data: strengths }] = await Promise.all([
        supabase
          .from('agency_services')
          .select('service_id, services(name)')
          .eq('agency_id', agency.id)
          .order('service_id'),
        supabase
          .from('agency_service_strengths')
          .select('service_id, points')
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
      const pts: Record<string, number> = {};
      (strengths ?? []).forEach((r: { service_id: string; points: number }) => { pts[r.service_id] = r.points; });
      setPoints(pts);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => Object.values(points).reduce((a, b) => a + (b || 0), 0), [points]);

  const setServicePoints = (id: string, value: number) => {
    setPoints((prev) => ({ ...prev, [id]: value }));
  };

  const onSaveNext = async () => {
    if (total > MAX_TOTAL) {
      toast.error("You have allocated more than 20 points.");
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
    const { error: delErr } = await supabase.from('agency_service_strengths').delete().eq('agency_id', agency.id);
    if (delErr) {
      setSaving(false);
      toast.error("Failed to save", { description: delErr.message });
      return;
    }
    const rows = services.map((s) => ({ agency_id: agency.id, service_id: s.id, points: points[s.id] ?? 0 }));
    const { error: insErr } = await supabase.from('agency_service_strengths').insert(rows);
    setSaving(false);
    if (insErr) {
      toast.error("Failed to save", { description: insErr.message });
      return;
    }
    toast.success("Strengths saved");
    window.location.href = '/provider/onboarding/step-4';
  };

  if (services.length === 0) return <p>Select services in Step 2 first.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">        
        <div className="p-4 rounded-lg" style={{ width: '600px', backgroundColor: '#ffffff', color: '#000000' }}>
          <ul className="text-sm space-y-2">
            <li className="flex items-center">
              <span style={{ background: 'var(--Primary-Color, #71A37A)' }} className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              <span >Total: {MAX_TOTAL} stars</span>
            </li>
            <li className="flex items-center">
              <span style={{ background: 'var(--Primary-Color, #71A37A)' }} className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              <span >Max stars per service: 5</span>
            </li>
            <li className="flex items-center">
              <span style={{ background: 'var(--Primary-Color, #71A37A)' }} className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              <span >Agencies distribute these stars across the services they selected</span>
            </li>
            <li className="flex items-center">
              <span style={{ background: 'var(--Primary-Color, #71A37A)' }} className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              <span >This helps power the &quot;Specialty Services&quot; tag later shown to users</span>
            </li>
          </ul>
        </div>
        
        <div className="p-4 rounded-lg" style={{ width: '600px', backgroundColor: '#ffffff', color: '#000000' }}>
          <div className="grid grid-cols-2">
            {services.map((s) => (
              <div key={s.id} className="flex flex-col p-4" style={{ border: '1px solid #E8E8E8' }}>
                <div className="mb-3">
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <StarRating
                  value={points[s.id] ?? 0}
                  onChange={(value) => setServicePoints(s.id, value)}
                  max={5}
                  size="md"
                />
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E8E8E8' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Stars</span>
              <span className="text-sm font-medium">Used {total}/{MAX_TOTAL}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        className="w-full my-4"
        style={{
          borderBottom: '1px solid #E8E8E8',
          width: '600px',
          margin: '0 auto'
        }}
      ></div>

      <div className="flex flex-col items-center space-y-4 pt-6">
        <button
          type="button"
          onClick={onSaveNext}
          disabled={saving || total > MAX_TOTAL}
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
          onClick={() => window.location.href = '/provider/onboarding/step-2'}
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


