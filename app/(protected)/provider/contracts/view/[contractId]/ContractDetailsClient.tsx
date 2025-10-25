"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, DollarSign, User, Phone, Mail } from "lucide-react";
import Link from "next/link";

interface ContractDetailsClientProps {
  contract: any;
  agencyId: string;
}

export default function ContractDetailsClient({ contract, agencyId }: ContractDetailsClientProps) {
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/provider/contracts"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contracts
              </Link>
            </div>
            <Badge className={getStatusColor(contract.status)}>
              {contract.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Contract Details</CardTitle>
            <p className="text-sm text-gray-600">Contract ID: {contract.id}</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <User className="h-5 w-5 mr-2" />
                        Client Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium">{contract.patients?.families?.full_name}</p>
                          <p className="text-sm text-gray-600">Family Contact</p>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {contract.patients?.families?.phone_number || 'Not provided'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Care Recipient */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <User className="h-5 w-5 mr-2" />
                        Care Recipient
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium">{contract.patients?.full_name}</p>
                          <p className="text-sm text-gray-600">{contract.patients?.age} years old</p>
                        </div>
                        <div className="text-sm">
                          <p><strong>Care Level:</strong> {contract.patients?.care_level}</p>
                          <p><strong>Medical Conditions:</strong> {contract.patients?.medical_conditions || 'None specified'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Care Needs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Care Needs & Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Care Needs</h4>
                        <p className="text-sm text-gray-700">{contract.patients?.care_needs || 'No specific needs documented'}</p>
                      </div>
                      {contract.patients?.notes && (
                        <div>
                          <h4 className="font-medium mb-2">Additional Notes</h4>
                          <p className="text-sm text-gray-700">{contract.patients.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Service Type</p>
                          <p className="text-lg">{contract.service_type || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Duration</p>
                          <p className="text-lg">{contract.duration || 'Not specified'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Service Description</p>
                        <p className="text-sm text-gray-700">{contract.service_description || 'No description provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Rate</p>
                          <p className="text-lg font-semibold">${Number(contract.rate || 0).toFixed(2)}/hour</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Billing Type</p>
                          <p className="text-lg">{contract.billing_type || 'Not specified'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Payment Method</p>
                        <p className="text-lg">{contract.payment_method || 'Not specified'}</p>
                      </div>
                      {contract.start_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Start Date</p>
                          <p className="text-lg">{formatDate(contract.start_date)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              {contract.status === 'draft' && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Edit Contract
                </Button>
              )}
              {contract.status === 'sent' && (
                <Button className="bg-green-600 hover:bg-green-700">
                  Send Reminder
                </Button>
              )}
              <Button variant="outline">
                Print Contract
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


