"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Leaf, Bell } from "lucide-react";
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
  notes: string;
  created_at: string;
  families: {
    id: string;
    full_name: string;
    phone_number: string;
    user_id: string;
  };
}

interface Agency {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface CreateContractClientProps {
  patient: Patient;
  agency: Agency;
  contractId: string;
  agencyId: string;
}

interface ContractData {
  // Basic Details
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  careRecipientName: string;
  careRecipientAge: number;
  careRecipientAddress: string;
  careRecipientConditions: string[];
  providerName: string;
  providerAddress: string;
  providerEmail: string;
  providerPhone: string;
  
  // Plan Details
  selectedServices: string[];
  customServices: Array<{ name: string; notes: string }>;
  careType: string;
  careSchedule: string[];
  careTimes: string[];
  minSessions: number;
  maxSessions: number;
  startDate: string;
  endDate: string;
  effectiveDate: string;
  paymentMethod: string;
  billingType: string;
  rate: number;
  
  // Legal
  termsAccepted: boolean;
}

export default function CreateContractClient({ patient, agency, contractId, agencyId }: CreateContractClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic-details');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [contractData, setContractData] = useState<ContractData>({
    // Basic Details - populated from patient data
    clientName: patient.families.full_name,
    clientPhone: patient.families.phone_number || '',
    clientEmail: '', // Will be fetched from user data
    careRecipientName: patient.full_name,
    careRecipientAge: patient.age,
    careRecipientAddress: '', // Not available in current schema
    careRecipientConditions: patient.care_needs || [],
    providerName: agency.business_name,
    providerAddress: `${agency.address}, ${agency.city}, ${agency.state} ${agency.zip_code}`,
    providerEmail: agency.email,
    providerPhone: agency.phone,
    
    // Plan Details - defaults
    selectedServices: [
      'Personal care (bathing, dressing, grooming)',
      'Mobility assistance & safe transfers',
      'Medication reminders and tracking',
      'Meal preparation (light cooking, diet support)',
      'Transportation to medical appointments',
      'Companionship and social engagement'
    ],
    customServices: [],
    careType: 'In-home senior care',
    careSchedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    careTimes: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Night (9 PM - 12 AM)'],
    minSessions: 0,
    maxSessions: 0,
    startDate: '',
    endDate: '',
    effectiveDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    paymentMethod: 'Credit Card',
    billingType: 'Monthly',
    rate: 0,
    
    // Legal
    termsAccepted: false
  });

  const handleInputChange = (field: keyof ContractData, value: any) => {
    setContractData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceToggle = (service: string) => {
    setContractData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(service)
        ? prev.selectedServices.filter(s => s !== service)
        : [...prev.selectedServices, service]
    }));
  };

  const handleScheduleToggle = (day: string) => {
    setContractData(prev => ({
      ...prev,
      careSchedule: prev.careSchedule.includes(day)
        ? prev.careSchedule.filter(d => d !== day)
        : [...prev.careSchedule, day]
    }));
  };

  const handleTimeToggle = (time: string) => {
    setContractData(prev => ({
      ...prev,
      careTimes: prev.careTimes.includes(time)
        ? prev.careTimes.filter(t => t !== time)
        : [...prev.careTimes, time]
    }));
  };

  const addCustomService = () => {
    setContractData(prev => ({
      ...prev,
      customServices: [...prev.customServices, { name: '', notes: '' }]
    }));
  };

  const updateCustomService = (index: number, field: 'name' | 'notes', value: string) => {
    setContractData(prev => ({
      ...prev,
      customServices: prev.customServices.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contractData,
          patientId: patient.id,
          contractId,
          status: 'draft'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save draft');
      }

      const result = await response.json();
      alert('Draft saved successfully!');
      router.push('/provider/contracts');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert(`Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendContract = async () => {
    setIsSending(true);
    try {
      const response = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contractData,
          patientId: patient.id,
          contractId,
          status: 'sent'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send contract');
      }

      const result = await response.json();
      alert('Contract sent successfully!');
      router.push('/provider/contracts');
    } catch (error) {
      console.error('Error sending contract:', error);
      alert(`Failed to send contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const tabs = [
    { id: 'basic-details', label: 'Basic Details' },
    { id: 'plan-details', label: 'Plan Details' },
    { id: 'legal', label: 'Legal' }
  ];

  const predefinedServices = [
    'Personal care (bathing, dressing, grooming)',
    'Mobility assistance & safe transfers',
    'Medication reminders and tracking',
    'Meal preparation (light cooking, diet support)',
    'Transportation to medical appointments',
    'Companionship and social engagement'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeBlocks = [
    'Morning (8 AM - 12 PM)',
    'Afternoon (12 PM - 4 PM)',
    'Evening (6 PM - 9 PM)',
    'Night (9 PM - 12 AM)'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/provider/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-green-800">Senior Care Central</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/provider/dashboard"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/provider/contracts"
                className="px-3 py-2 text-sm font-medium text-green-600 border-b-2 border-green-600"
              >
                Contracts
              </Link>
              <Link
                href="/provider/messages"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Messages
              </Link>
              <Link
                href="/provider/invoices"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Invoices
              </Link>
              <Link
                href="/provider/profile"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Profile
              </Link>
            </div>

            {/* Notification Bell */}
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="text-gray-600 mb-2 -ml-3"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to contracts
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Senior Care Service Agreement</h1>
                <p className="text-gray-600 mt-1">
                  Draft edited on: {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Contract ID: {contractId}</p>
                <Badge className="bg-orange-500 text-white mt-1">DRAFT</Badge>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'basic-details' && (
              <div className="space-y-8">
                {/* Client Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Client</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        value={contractData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientPhone">Phone</Label>
                      <Input
                        id="clientPhone"
                        value={contractData.clientPhone}
                        onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={contractData.clientEmail}
                        onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Care Recipient Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Recipient</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="careRecipientName">Name</Label>
                      <Input
                        id="careRecipientName"
                        value={contractData.careRecipientName}
                        onChange={(e) => handleInputChange('careRecipientName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="careRecipientAge">Age</Label>
                      <Input
                        id="careRecipientAge"
                        type="number"
                        value={contractData.careRecipientAge}
                        onChange={(e) => handleInputChange('careRecipientAge', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="careRecipientAddress">Address</Label>
                      <Input
                        id="careRecipientAddress"
                        value={contractData.careRecipientAddress}
                        onChange={(e) => handleInputChange('careRecipientAddress', e.target.value)}
                        placeholder="Enter full address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Summary of condition</Label>
                      <div className="space-y-2">
                        {contractData.careRecipientConditions.map((condition, index) => (
                          <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {condition}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provider Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="providerName">Company Name</Label>
                      <Input
                        id="providerName"
                        value={contractData.providerName}
                        onChange={(e) => handleInputChange('providerName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="providerPhone">Phone</Label>
                      <Input
                        id="providerPhone"
                        value={contractData.providerPhone}
                        onChange={(e) => handleInputChange('providerPhone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="providerEmail">Email</Label>
                      <Input
                        id="providerEmail"
                        type="email"
                        value={contractData.providerEmail}
                        onChange={(e) => handleInputChange('providerEmail', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="providerAddress">Address</Label>
                      <Input
                        id="providerAddress"
                        value={contractData.providerAddress}
                        onChange={(e) => handleInputChange('providerAddress', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plan-details' && (
              <div className="space-y-8">
                {/* Care Plan & Services */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Plan & Services</h3>
                  <p className="text-gray-600 mb-4">The Agency agrees to provide care for the Care Recipient, including:</p>
                  
                  <div className="space-y-3">
                    {predefinedServices.map((service) => (
                      <div key={service} className="flex items-center space-x-3">
                        <Checkbox
                          id={service}
                          checked={contractData.selectedServices.includes(service)}
                          onCheckedChange={() => handleServiceToggle(service)}
                        />
                        <Label htmlFor={service} className="text-sm">{service}</Label>
                      </div>
                    ))}
                  </div>

                  {/* Custom Services */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Add Custom Services</h4>
                    {contractData.customServices.map((service, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Service name</Label>
                          <Input
                            placeholder="Service name here"
                            value={service.name}
                            onChange={(e) => updateCustomService(index, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            placeholder="Notes"
                            value={service.notes}
                            onChange={(e) => updateCustomService(index, 'notes', e.target.value)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={addCustomService} className="mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Service
                    </Button>
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="careType">Care Type</Label>
                      <Select value={contractData.careType} onValueChange={(value) => handleInputChange('careType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In-home senior care">In-home senior care</SelectItem>
                          <SelectItem value="Assisted living">Assisted living</SelectItem>
                          <SelectItem value="Memory care">Memory care</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Care Schedule</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {daysOfWeek.map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={day}
                              checked={contractData.careSchedule.includes(day)}
                              onCheckedChange={() => handleScheduleToggle(day)}
                            />
                            <Label htmlFor={day} className="text-sm">{day}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Times</Label>
                      <div className="space-y-2 mt-2">
                        {timeBlocks.map((time) => (
                          <div key={time} className="flex items-center space-x-2">
                            <Checkbox
                              id={time}
                              checked={contractData.careTimes.includes(time)}
                              onCheckedChange={() => handleTimeToggle(time)}
                            />
                            <Label htmlFor={time} className="text-sm">{time}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Sessions</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label htmlFor="minSessions" className="text-xs">Min</Label>
                          <Input
                            id="minSessions"
                            type="number"
                            value={contractData.minSessions}
                            onChange={(e) => handleInputChange('minSessions', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxSessions" className="text-xs">Max</Label>
                          <Input
                            id="maxSessions"
                            type="number"
                            value={contractData.maxSessions}
                            onChange={(e) => handleInputChange('maxSessions', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={contractData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate" className="text-xs">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={contractData.endDate}
                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Terms */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="effectiveDate">Effective Date</Label>
                      <Input
                        id="effectiveDate"
                        value={contractData.effectiveDate}
                        onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={contractData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="billingType">Billing Type (Monthly or Hourly)</Label>
                      <Select value={contractData.billingType} onValueChange={(value) => handleInputChange('billingType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Hourly">Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rate">Rate</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          id="rate"
                          type="number"
                          value={contractData.rate}
                          onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Condition</h3>
                  <Textarea
                    className="min-h-32"
                    placeholder="Enter terms and conditions..."
                    defaultValue="Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancellation and Disputes</h3>
                  <Textarea
                    className="min-h-32"
                    placeholder="Enter cancellation and dispute terms..."
                    defaultValue="Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Disclaimer</h3>
                  <Textarea
                    className="min-h-32"
                    placeholder="Enter platform disclaimer..."
                    defaultValue="Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Acceptance</h3>
                  <Textarea
                    className="min-h-32"
                    placeholder="Enter acceptance terms..."
                    defaultValue="Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="termsAccepted"
                    checked={contractData.termsAccepted}
                    onCheckedChange={(checked) => handleInputChange('termsAccepted', checked)}
                  />
                  <Label htmlFor="termsAccepted" className="text-sm">
                    I have read and agree to the terms and conditions
                  </Label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                {isSaving ? 'Saving...' : 'SAVE AS DRAFT'}
              </Button>
              <Button
                onClick={handleSendContract}
                disabled={isSending || !contractData.termsAccepted}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSending ? 'Sending...' : 'SEND CONTRACT'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
