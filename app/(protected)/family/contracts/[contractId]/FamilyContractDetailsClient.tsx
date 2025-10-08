"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FamilyContractDetailsClient({ contract }: { contract: any }) {
  const [loading, setLoading] = useState(false);

  const onAccept = async () => {
    if (!confirm('Accept this contract and proceed to billing setup?')) return;
    setLoading(true);
    await fetch('/api/contracts/accept', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: contract.id, agencyId: contract.agency_id }) });
    setLoading(false);
    window.history.back();
  };
  const onDecline = async () => {
    if (!confirm('Decline this contract?')) return;
    setLoading(true);
    await fetch('/api/contracts/decline', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: contract.id, agencyId: contract.agency_id }) });
    setLoading(false);
    window.history.back();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Senior Care Service Agreement</h1>
          <p className="text-sm text-gray-600">Contract ID: {contract.contract_id}</p>
        </div>
        <Badge>{contract.status.toUpperCase()}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Client</h3>
          <div className="text-sm">
            <p>{contract.patients?.families?.full_name}</p>
            <p>(contact info)</p>
          </div>
          <h3 className="font-semibold mt-4 mb-2">Care Recipient</h3>
          <div className="text-sm">
            <p>{contract.patients?.full_name}</p>
            <p>{contract.patients?.age} years old</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Provider</h3>
          <div className="text-sm">
            <p>{contract.agencies?.business_name}</p>
            <p>{contract.agencies?.email || '(—)'} / {contract.agencies?.phone || '(—)'}</p>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Rate</span><span>${Number(contract.rate || 0).toFixed(2)}/hour</span></div>
            <div className="flex justify-between"><span>Billing</span><span>{contract.billing_type}</span></div>
            <div className="flex justify-between"><span>Payment Method</span><span>{contract.payment_method}</span></div>
          </div>
        </div>
      </div>

      {['sent','under_review'].includes(contract.status) && (
        <div className="flex gap-3 mt-8">
          <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={loading} onClick={onAccept}>Accept</Button>
          <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" disabled={loading} onClick={onDecline}>Decline</Button>
        </div>
      )}
    </div>
  );
}


