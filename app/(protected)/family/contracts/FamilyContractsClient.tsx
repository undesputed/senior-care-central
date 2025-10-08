"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ContractStatus = "draft"|"sent"|"under_review"|"accepted"|"rejected"|"cancelled"|"completed";

interface Row {
  id: string;
  status: ContractStatus;
  contract_id: string;
  created_at: string;
  rate: number;
  agencies: { id: string; business_name: string };
  patients: { id: string; full_name: string; families: { full_name: string } };
}

export default function FamilyContractsClient() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"care-confirmed" | "invites-sent">("care-confirmed");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setRows([]); setLoading(false); return; }
      const { data: family } = await supabase.from('families').select('id').eq('user_id', user.id).single();
      if (!family) { setRows([]); setLoading(false); return; }

      const { data } = await supabase
        .from('contracts')
        .select(`id,status,contract_id,created_at,rate,
                 agencies(id,business_name),
                 patients(id,full_name,families(full_name))`)
        .eq('family_id', family.id)
        .order('created_at', { ascending: false });

      setRows((data || []) as any);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const filtered = activeTab === 'care-confirmed'
    ? rows.filter(r=>['accepted','completed'].includes(r.status))
    : rows.filter(r=>['sent','under_review','rejected','cancelled','draft'].includes(r.status));

  const statusBadge = (status: ContractStatus) => {
    switch(status){
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'under_review': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sent': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const acceptContract = async (id: string, agencyId: string) => {
    if (!confirm('Accept this contract and proceed to billing setup?')) return;
    const res = await fetch('/api/contracts/accept', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, agencyId }) });
    if (res.ok) setRows(prev=>prev.map(r=>r.id===id?{...r,status:'accepted'}:r));
  };
  const declineContract = async (id: string, agencyId: string) => {
    if (!confirm('Decline this contract?')) return;
    const res = await fetch('/api/contracts/decline', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, agencyId }) });
    if (res.ok) setRows(prev=>prev.map(r=>r.id===id?{...r,status:'rejected'}:r));
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("care-confirmed")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "care-confirmed"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Care-Confirmed
          </button>
          <button
            onClick={() => setActiveTab("invites-sent")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "invites-sent"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Invites Sent
          </button>
        </div>
      </div>

      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(loading ? [] : filtered).map((c) => (
          <Card key={c.id} className="bg-green-50 border-green-200 hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                {/* Left: Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                {/* Middle: Contract Info */}
                <div className="flex-1 mx-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{c.agencies.business_name}</h3>
                    <div className="flex items-center space-x-1 mt-1">
                      <p className="text-xs text-gray-600">For: {c.patients.families.full_name}</p>
                      <Badge className={`${statusBadge(c.status)} text-xs px-1 py-0`}>
                        {c.status.replace('_',' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Right: Message Icon */}
                <div className="flex-shrink-0 relative">
                  <Button variant="ghost" size="sm" className="relative p-2">
                    <MessageCircle className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>
              </div>

              {/* Actions for pending contracts */}
              {['sent','under_review'].includes(c.status) && (
                <div className="flex gap-2 mt-3">
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={()=>acceptContract(c.id, c.agencies.id)}>Accept</Button>
                  <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={()=>declineContract(c.id, c.agencies.id)}>Decline</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab === "care-confirmed" ? "Accepted Contracts" : "Pending or Declined Contracts"}
            </h3>
            <p className="text-gray-600">
              {activeTab === "care-confirmed" ? "You don't have any accepted contracts yet." : "You don't have any pending invites right now."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
