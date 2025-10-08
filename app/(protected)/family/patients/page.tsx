import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";

type Patient = {
  id: string;
  full_name: string | null;
  age: number | null;
  relationship: string | null;
  care_level: string | null;
  status: string | null;
  created_at: string;
};

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

  // Load real patients for this family
  const { data: patients = [] } = await supabase
    .from('patients')
    .select('id, full_name, age, relationship, care_level, status, created_at')
    .eq('family_id', family?.id)
    .order('created_at', { ascending: false });

  return (
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
            <p className="text-gray-600">Manage your loved ones' care information</p>
          </div>
          <Link href="/family/patients/onboarding">
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </Link>
        </div>

        {/* Removed stats cards as requested */}

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patient List</CardTitle>
          </CardHeader>
          <CardContent>
            {patients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Care Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient: Patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/family/patients/matches/${patient.id}`}
                            className="text-gray-900 hover:text-green-700 hover:underline"
                            aria-label={`View matches for ${patient.full_name || 'patient'}`}
                          >
                            {patient.full_name || 'Unnamed'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/family/patients/matches/${patient.id}`}
                            className="text-gray-700 hover:text-green-700 hover:underline"
                            aria-label={`View matches for ${patient.full_name || 'patient'}`}
                          >
                            {patient.age ?? '-'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/family/patients/matches/${patient.id}`}
                            className="text-gray-700 hover:text-green-700 hover:underline"
                            aria-label={`View matches for ${patient.full_name || 'patient'}`}
                          >
                            {patient.relationship ?? '-'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/family/patients/matches/${patient.id}`}
                            aria-label={`View matches for ${patient.full_name || 'patient'}`}
                          >
                            <Badge className={getCareLevelColor(patient.care_level || '')}>
                              {(patient.care_level || 'unknown').replace('_', ' ').toUpperCase()}
                            </Badge>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/family/patients/matches/${patient.id}`}
                            aria-label={`View matches for ${patient.full_name || 'patient'}`}
                          >
                            <Badge className={getStatusColor(patient.status || 'inactive')}>
                              {(patient.status || 'inactive').toUpperCase()}
                            </Badge>
                          </Link>
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
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Patient
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
