"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, User, Calendar, DollarSign } from "lucide-react";
import { PublishBanner } from "@/components/provider/PublishBanner";
import { PublishedBanner } from "@/components/provider/PublishedBanner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";

interface Patient {
  id: string;
  full_name: string;
  age: number;
  relationship: string;
  care_level: string;
  medical_conditions: string[];
  care_needs: string[];
  status: string;
  created_at: string;
  families: {
    id: string;
    full_name: string;
    phone_number: string;
    user_id: string;
  };
  matchScore: number;
}

interface Agency {
  status: string;
  business_name: string;
}

interface User {
  email: string;
}

interface ProviderDashboardClientProps {
  agency: Agency | null;
  user: User;
}

export default function ProviderDashboardClient({ agency, user }: ProviderDashboardClientProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const supabase = createClient();

  // Fetch care matches for this agency
  useEffect(() => {
    const fetchPatients = async () => {
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

        // Get care matches with patient and family data
        const { data: matches, error } = await supabase
          .from('care_matches')
          .select(`
            id,
            patient_id,
            score,
            patients!inner(
              id,
              full_name,
              age,
              relationship,
              care_level,
              medical_conditions,
              care_needs,
              status,
              created_at,
              families!inner(
                id,
                full_name,
                phone_number,
                user_id
              )
            )
          `)
          .eq('agency_id', agency.id)
          .order('score', { ascending: false });

        if (error) {
          console.error('Error fetching care matches:', error);
          return;
        }

        // Transform data to patient format
        const patientsData: Patient[] = (matches || []).map((match: any) => ({
          id: match.patients.id,
          full_name: match.patients.full_name,
          age: match.patients.age || 0,
          relationship: match.patients.relationship || 'N/A',
          care_level: match.patients.care_level || 'N/A',
          medical_conditions: match.patients.medical_conditions || [],
          care_needs: match.patients.care_needs || [],
          status: match.patients.status || 'active',
          created_at: match.patients.created_at,
          families: match.patients.families,
          matchScore: match.score
        }));

        setPatients(patientsData);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [supabase]);

  // Calculate filter counts
  const filterCounts = {
    All: patients.length,
    High: patients.filter(p => p.matchScore >= 80).length,
    Medium: patients.filter(p => p.matchScore >= 60 && p.matchScore < 80).length,
    Low: patients.filter(p => p.matchScore < 60).length,
  };

  // Filter patients based on active filter
  const filteredPatients = activeFilter === 'All' 
    ? patients 
    : activeFilter === 'High'
    ? patients.filter(p => p.matchScore >= 80)
    : activeFilter === 'Medium'
    ? patients.filter(p => p.matchScore >= 60 && p.matchScore < 80)
    : patients.filter(p => p.matchScore < 60);

  // Create filter tabs with real data
  const filterTabs = [
    { name: 'All', count: filterCounts.All, active: activeFilter === 'All' },
    { name: 'High Match', count: filterCounts.High, active: activeFilter === 'High' },
    { name: 'Medium Match', count: filterCounts.Medium, active: activeFilter === 'Medium' },
    { name: 'Low Match', count: filterCounts.Low, active: activeFilter === 'Low' },
  ];

  const handleFilterChange = (filterName: string) => {
    setActiveFilter(filterName);
  };

  const getMatchBadgeClass = (score: number) => {
    if (score >= 80) return "bg-green-500 text-white";
    if (score >= 60) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  if (loading) {
    return (
      <DashboardLayout 
        title="Dashboard" 
        showSearch={true} 
        showFilters={true} 
        showViewToggle={true}
        filterTabs={filterTabs}
        onFilterChange={handleFilterChange}
      >
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading patients...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
        {/* Patients Grid */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Matched Patients</h3>
          {filteredPatients.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <p>No patients found for the selected filter.</p>
                  <p className="text-sm mt-2">
                    {patients.length === 0 
                      ? 'Patients will appear here once they are matched with your agency.'
                      : 'Try adjusting your filter criteria.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    // Navigate to patient detail page
                    window.location.href = `/provider/contracts/${patient.id}`;
                  }}
                >
                  <CardContent className="p-4">
                    {/* Patient Avatar and Match Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl font-bold">
                          {patient.full_name.charAt(0)}
                        </div>
                        <Badge className={`absolute -top-2 -left-2 ${getMatchBadgeClass(patient.matchScore)} text-xs px-2 py-1 rounded-full`}>
                          {Math.round(patient.matchScore)}% match
                        </Badge>
                      </div>

                      {/* Message Icon */}
                      <div className="relative">
                        <MessageCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>

                    {/* Patient Information */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {patient.full_name} ({patient.age})
                        </h3>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Client:</span> {patient.families.full_name}
                      </p>
                      
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Relationship:</span> {patient.relationship}
                      </p>

                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Care Level:</span> {patient.care_level}
                      </p>

                      {/* Care Needs */}
                      {patient.care_needs.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Care Needs:</p>
                          <div className="flex flex-wrap gap-1">
                            {patient.care_needs.slice(0, 3).map((need, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {need}
                              </Badge>
                            ))}
                            {patient.care_needs.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{patient.care_needs.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
