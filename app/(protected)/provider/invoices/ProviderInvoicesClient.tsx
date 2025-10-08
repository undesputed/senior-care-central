"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import Link from "next/link";

interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amount_total: number;
  created_at: string;
  contract_id: string;
  patients: { full_name: string } | null;
  families: { full_name: string } | null;
}

interface Props { agencyId: string }

export default function ProviderInvoicesClient({ agencyId }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id, number, status, amount_total, created_at, contract_id,
          patients(full_name),
          families(full_name)
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (!error && data) setInvoices(data as any);
      setLoading(false);
    };
    if (agencyId) fetchInvoices();
  }, [agencyId]);

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      const matchesQuery = query
        ? (i.number || '').toLowerCase().includes(query.toLowerCase()) ||
          (i.patients?.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
          (i.families?.full_name || '').toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesStatus = status === 'all' ? true : i.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, query, status]);

  const statusBadge = (s: string) => {
    const map: Record<string,string> = {
      draft: 'bg-gray-200 text-gray-800',
      open: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      uncollectible: 'bg-red-100 text-red-700',
      void: 'bg-gray-100 text-gray-600'
    };
    return map[s] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link href="/provider/invoices/new" className="text-sm text-green-700">Generate invoice</Link>
      </div>

      <div className="flex gap-3 items-center mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
          <Input placeholder="Search by client or recipient" className="pl-8" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Invoice Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="uncollectible">Uncollectible</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3">Invoice #</th>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">Care recipient</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="p-4" colSpan={7}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="p-4" colSpan={7}>No invoices</td></tr>
                ) : filtered.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="p-3">{inv.number || '—'}</td>
                    <td className="p-3">{inv.families?.full_name || '—'}</td>
                    <td className="p-3">{inv.patients?.full_name || '—'}</td>
                    <td className="p-3">${(inv.amount_total/100).toFixed(2)}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded ${statusBadge(inv.status)}`}>{inv.status}</span></td>
                    <td className="p-3">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Link href={`/provider/invoices/${inv.id}`} className="text-green-700">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


