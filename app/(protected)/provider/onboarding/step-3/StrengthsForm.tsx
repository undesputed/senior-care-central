"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

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
      const svcRows = (selected ?? []).map((row: any) => ({ id: row.service_id, name: row.services.name }));
      setServices(svcRows);
      const pts: Record<string, number> = {};
      (strengths ?? []).forEach((r: any) => { pts[r.service_id] = r.points; });
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
      <div className="text-sm">Points left: {Math.max(0, MAX_TOTAL - total)}</div>
      <div className="grid gap-6">
        {services.map((s) => (
          <div key={s.id}>
            <div className="mb-2 flex items-center justify-between">
              <span>{s.name}</span>
              <span className="text-sm text-muted-foreground">{points[s.id] ?? 0}/5</span>
            </div>
            <Slider
              value={[points[s.id] ?? 0]}
              max={5}
              step={1}
              onValueChange={(v) => setServicePoints(s.id, v[0] ?? 0)}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Link href="/provider/onboarding/step-2" className="underline">Back</Link>
        <Button onClick={onSaveNext} disabled={saving || total > MAX_TOTAL} style={{ backgroundColor: "#9bc3a2" }}>Next</Button>
      </div>
    </div>
  );
}


