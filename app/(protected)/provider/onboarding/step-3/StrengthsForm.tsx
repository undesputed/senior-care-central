"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
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
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="text-sm font-medium text-blue-900">
          Star Points Left: {Math.max(0, MAX_TOTAL - total)} / {MAX_TOTAL}
        </div>
        <div className="text-xs text-blue-700 mt-1">
          Allocate up to 5 stars per service. Total cannot exceed {MAX_TOTAL} stars.
        </div>
      </div>
      
      <div className="space-y-6">
        {services.map((s) => (
          <div key={s.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="mb-3">
              <span className="font-medium text-gray-900">{s.name}</span>
              <span className="text-red-500 ml-1">*</span>
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
      
      <p className="text-sm text-muted-foreground">
        * Rate your expertise level for each service using star points (0-5 stars per service)
      </p>
      
      <div className="flex items-center justify-between pt-4">
        <Link href="/provider/onboarding/step-2" className="underline text-gray-600 hover:text-gray-800">
          ← Back
        </Link>
        <Button 
          onClick={onSaveNext} 
          disabled={saving || total > MAX_TOTAL} 
          style={{ backgroundColor: "#9bc3a2" }}
          className="px-6"
        >
          {saving ? "Saving..." : "Next →"}
        </Button>
      </div>
    </div>
  );
}


