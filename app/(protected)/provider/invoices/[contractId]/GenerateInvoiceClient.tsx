"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Props {
  contract: any;
  agencyId: string;
}

export default function GenerateInvoiceClient({ contract, agencyId }: Props) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [notes, setNotes] = useState<string>("");
  const rate = Number(contract.rate || 0);

  const subtotal = Math.round(rate * 25 * 100); // placeholder: 25 hours
  const platformFee = Math.round(subtotal * 0.01);
  const total = subtotal + platformFee;

  const handleGenerate = async () => {
    await fetch('/api/invoices/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractId: contract.id,
        agencyId,
        patientId: contract.patient_id,
        familyId: contract.family_id,
        amountSubtotal: subtotal,
        amountTax: 0,
        amountTotal: total,
        dueDate: date,
        lines: [{ description: 'Care services', hours: 25, unit_amount: Math.round(rate*100), amount: subtotal }],
        meta: { notes }
      })
    });
    window.location.href = '/provider/invoices';
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Generate Invoice</h1>
        <div>
          <p className="text-sm text-gray-600">Contract ID: {contract.contract_id}</p>
          <Badge className="ml-auto mt-1">ACTIVE</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-3">Client</h3>
          <div className="text-sm space-y-1">
            <p>{contract.patients?.families?.full_name}</p>
            <p>{contract.patients?.families?.phone_number || '(—)'}</p>
            <p>(email unavailable)</p>
          </div>

          <h3 className="font-medium mt-6 mb-3">Care Recipient</h3>
          <div className="text-sm space-y-1">
            <p>{contract.patients?.full_name}</p>
            <p>{contract.patients?.age}</p>
            <p>Address unavailable</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Service Period</label>
          <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="mb-3" />
          <label className="text-sm text-gray-600">Notes</label>
          <Input value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Optional note" />

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Rate</span><Badge>${rate.toFixed(2)}/hour</Badge></div>
            <div className="flex justify-between"><span>Amount</span><span>${(subtotal/100).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Platform fee</span><span>${(platformFee/100).toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold"><span>Net to Agency</span><span>${(total/100).toFixed(2)}</span></div>
          </div>

          <Button className="w-full mt-6" onClick={handleGenerate}>GENERATE INVOICE</Button>
        </div>
      </div>
    </div>
  );
}


