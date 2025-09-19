import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyDashboardLayout from "@/components/layout/FamilyDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";

// Static patient data for now
const staticPatients = [
  {
    id: "1",
    full_name: "Mary Johnson",
    age: 78,
    relationship: "Mother",
    care_level: "assisted",
    medical_conditions: ["Diabetes", "High Blood Pressure"],
    care_needs: ["Medication Management", "Meal Preparation", "Transportation"],
    status: "active",
    created_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2", 
    full_name: "Robert Smith",
    age: 82,
    relationship: "Father",
    care_level: "skilled",
    medical_conditions: ["Alzheimer's", "Arthritis"],
    care_needs: ["Memory Care", "Physical Therapy", "24/7 Supervision"],
    status: "active",
    created_at: "2024-01-20T14:30:00Z"
  },
  {
    id: "3",
    full_name: "Helen Davis",
    age: 85,
    relationship: "Grandmother", 
    care_level: "independent",
    medical_conditions: ["Mild Dementia"],
    care_needs: ["Light Housekeeping", "Grocery Shopping"],
    status: "active",
    created_at: "2024-02-01T09:15:00Z"
  }
];

const getCareLevelColor = (level: string) => {
  switch (level) {
    case 'independent':
      return 'bg-green-100 text-green-800';
    case 'assisted':
      return 'bg-blue-100 text-blue-800';
    case 'skilled':
      return 'bg-orange-100 text-orange-800';
    case 'memory_care':
      return 'bg-purple-100 text-purple-800';
    case 'hospice':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'deceased':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default async function FamilyPatientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/family/login");
  }

  // Get family profile
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <FamilyDashboardLayout 
      title="Patients" 
      userName={family?.full_name || user.email}
    >
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
            <p className="text-gray-600">Manage your loved ones' care information</p>
          </div>
          <Link href="/family/patients/new">
            <Button className="w-full sm:w-auto" style={{ backgroundColor: "#9bc3a2" }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Total Patients</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{staticPatients.length}</p>
              <p className="text-sm text-gray-600">Loved ones in care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <CardTitle className="text-lg">Active Patients</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {staticPatients.filter(p => p.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Currently receiving care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                </div>
                <CardTitle className="text-lg">High Care Needs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {staticPatients.filter(p => p.care_level === 'skilled' || p.care_level === 'memory_care').length}
              </p>
              <p className="text-sm text-gray-600">Requiring intensive care</p>
            </CardContent>
          </Card>
        </div>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patient List</CardTitle>
          </CardHeader>
          <CardContent>
            {staticPatients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Care Level</TableHead>
                      <TableHead>Medical Conditions</TableHead>
                      <TableHead>Care Needs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staticPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.full_name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>{patient.relationship}</TableCell>
                        <TableCell>
                          <Badge className={getCareLevelColor(patient.care_level)}>
                            {patient.care_level.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {patient.medical_conditions.slice(0, 2).map((condition, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                            {patient.medical_conditions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{patient.medical_conditions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {patient.care_needs.slice(0, 2).map((need, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {need}
                              </Badge>
                            ))}
                            {patient.care_needs.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{patient.care_needs.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(patient.status)}>
                            {patient.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start by adding your first patient to begin managing their care information.
                </p>
                <Link href="/family/patients/new">
                  <Button style={{ backgroundColor: "#9bc3a2" }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Patient
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FamilyDashboardLayout>
  );
}
