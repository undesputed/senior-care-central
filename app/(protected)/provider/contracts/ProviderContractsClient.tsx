"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface Contract {
  id: string;
  contractId: string;
  patientId: string;
  clientName: string;
  clientAge: number;
  clientImage?: string;
  clientInitial?: string;
  status: 'draft' | 'sent' | 'under_review' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  representative: string;
  address: string;
  hasNewMessages: boolean;
  matchScore: number;
  familyName: string;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  rate: number;
  billingType: string;
}

const statusConfig = {
  draft: { label: "DRAFT", className: "bg-gray-500 text-white" },
  sent: { label: "SENT", className: "bg-blue-500 text-white" },
  under_review: { label: "UNDER REVIEW", className: "bg-yellow-500 text-white" },
  accepted: { label: "ACCEPTED", className: "bg-green-500 text-white" },
  rejected: { label: "REJECTED", className: "bg-red-500 text-white" },
  cancelled: { label: "CANCELLED", className: "bg-gray-500 text-white" },
  completed: { label: "COMPLETED", className: "bg-green-600 text-white" }
};

export default function ProviderContractsClient() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const supabase = createClient();

  // Fetch contracts for this agency
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get agency ID for this user
        const { data: agency } = await supabase
          .from('agencies')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (!agency) return;

        // Get contracts with patient and family data
        const { data: contractsData, error } = await supabase
          .from('contracts')
          .select(`
            id,
            contract_id,
            patient_id,
            status,
            client_name,
            care_recipient_name,
            care_recipient_age,
            care_recipient_address,
            rate,
            billing_type,
            created_at,
            sent_at,
            accepted_at,
            patients!inner(
              id,
              full_name,
              age,
              relationship,
              families!inner(
                id,
                full_name,
                user_id
              )
            )
          `)
          .eq('agency_id', agency.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching contracts:', error);
          return;
        }

        // Transform data to contract format
        const contracts: Contract[] = (contractsData || []).map((contract: any) => ({
          id: contract.id,
          contractId: contract.contract_id,
          patientId: contract.patient_id,
          clientName: contract.client_name,
          clientAge: contract.care_recipient_age || 0,
          clientInitial: contract.care_recipient_name?.charAt(0) || '?',
          status: contract.status,
          representative: `${contract.patients.families.full_name} (${contract.patients.relationship})`,
          address: contract.care_recipient_address || 'Address not available',
          hasNewMessages: false, // You can implement message tracking
          matchScore: 0, // Not applicable for contracts
          familyName: contract.patients.families.full_name,
          createdAt: contract.created_at,
          sentAt: contract.sent_at,
          acceptedAt: contract.accepted_at,
          rate: contract.rate || 0,
          billingType: contract.billing_type || 'Monthly'
        }));

        setContracts(contracts);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [supabase]);

  // Calculate filter counts
  const filterCounts = {
    All: contracts.length,
    Draft: contracts.filter(c => c.status === 'draft').length,
    Sent: contracts.filter(c => c.status === 'sent').length,
    'Under Review': contracts.filter(c => c.status === 'under_review').length,
    Accepted: contracts.filter(c => c.status === 'accepted').length,
    Rejected: contracts.filter(c => c.status === 'rejected').length,
    Completed: contracts.filter(c => c.status === 'completed').length,
  };

  // Filter contracts based on active filter
  const filteredContracts = activeFilter === 'All' 
    ? contracts 
    : activeFilter === 'Under Review'
    ? contracts.filter(contract => contract.status === 'under_review')
    : contracts.filter(contract => contract.status === activeFilter.toLowerCase());

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  // Create filter tabs with real data
  const filterTabs = [
    { name: 'All', count: filterCounts.All, active: activeFilter === 'All' },
    { name: 'Draft', count: filterCounts.Draft, active: activeFilter === 'Draft' },
    { name: 'Sent', count: filterCounts.Sent, active: activeFilter === 'Sent', hasNotification: filterCounts.Sent > 0 },
    { name: 'Under Review', count: filterCounts['Under Review'], active: activeFilter === 'Under Review' },
    { name: 'Accepted', count: filterCounts.Accepted, active: activeFilter === 'Accepted' },
    { name: 'Rejected', count: filterCounts.Rejected, active: activeFilter === 'Rejected' },
    { name: 'Completed', count: filterCounts.Completed, active: activeFilter === 'Completed' },
  ];

  const handleFilterChange = (filterName: string) => {
    setActiveFilter(filterName);
  };

  return (
    <DashboardLayout 
      title="Contract Management" 
      showSearch={true} 
      showFilters={true} 
      showViewToggle={true}
      filterTabs={filterTabs}
      onFilterChange={handleFilterChange}
    >
      <div className="p-6">
        {/* Contract Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <Card 
              key={contract.id} 
              className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                // Navigate to patient detail page
                window.location.href = `/provider/contracts/${contract.patientId}`;
              }}
            >
              <CardContent className="p-4">
                {/* Client Avatar and Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    {contract.clientImage ? (
                      <img
                        src={contract.clientImage}
                        alt={contract.clientName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-green-600">
                          {contract.clientInitial}
                        </span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <Badge 
                      className={`absolute -top-2 -left-2 px-2 py-1 text-xs font-medium ${getStatusConfig(contract.status).className}`}
                    >
                      {getStatusConfig(contract.status).label}
                    </Badge>
                  </div>

                  {/* Message Icon */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200"
                    >
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </Button>
                    {contract.hasNewMessages && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                </div>

                {/* Client Information */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {contract.clientName} ({contract.clientAge})
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {contract.contractId}
                      </Badge>
                    </div>
                  
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Client:</span> {contract.representative}
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Address:</span> {contract.address}
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Rate:</span> ${contract.rate} / {contract.billingType.toLowerCase()}
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Created:</span> {new Date(contract.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
            <h3 className="text-lg font-medium mb-2">
              {contracts.length === 0 ? 'No contracts found' : 'No contracts found'}
            </h3>
            <p>
              {contracts.length === 0 
                ? 'You don\'t have any contracts yet. Create contracts from your matched patients on the home page.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
