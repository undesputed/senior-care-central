"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "./PatientOnboardingWizard";
import { CheckCircle, User, Heart, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function Step7Review() {
  const { state, goToPreviousStep, completeOnboarding } = useOnboarding();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Step 1: Complete onboarding
      const response = await fetch('/api/patient-onboarding/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientData: state.patientData,
          selectedServices: state.selectedServices,
          schedulePreferences: state.schedulePreferences,
          budgetPreferences: state.budgetPreferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      const { patientId } = await response.json();

      // Step 2: Run matching algorithm
      toast.success("Finding your perfect matches...");
      
      const matchingResponse = await fetch('/api/matching/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });

      if (!matchingResponse.ok) {
        console.warn('Matching failed, but onboarding completed');
      }

      // Step 3: Redirect to matches page
      toast.success("Patient onboarding completed successfully!");
      window.location.href = `/family/patients/matches/${patientId}`;
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
          Review & Complete
        </CardTitle>
        <p className="text-gray-600">
          Review all the information you've provided and complete the onboarding process.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Basic Information Review */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 flex items-center mb-3">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{state.patientData.fullName || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600">Date of Birth:</span>
                <span className="ml-2 font-medium">{state.patientData.dateOfBirth || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600">Gender:</span>
                <span className="ml-2 font-medium capitalize">{state.patientData.gender || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600">Relationship:</span>
                <span className="ml-2 font-medium capitalize">{state.patientData.relationship || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600">Body Type:</span>
                <span className="ml-2 font-medium capitalize">{state.patientData.bodyType || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">{state.patientData.location || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Services Review */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 flex items-center mb-3">
              <Heart className="w-5 h-5 mr-2 text-green-600" />
              Selected Services
            </h3>
            {state.selectedServices.length > 0 ? (
              <div className="space-y-2">
                {state.selectedServices.map((service) => (
                  <div key={service.serviceId} className="text-sm">
                    <span className="font-medium">{service.serviceName}</span>
                    <span className="text-gray-600 ml-2">- {service.level.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No services selected</p>
            )}
          </div>

          {/* Schedule Review */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 flex items-center mb-3">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Schedule Preferences
            </h3>
            {state.schedulePreferences.days.length > 0 || state.schedulePreferences.timeBlocks.length > 0 || state.schedulePreferences.frequency ? (
              <div className="text-sm text-gray-700 space-y-1">
                {state.schedulePreferences.days.length > 0 && (
                  <p>• Days: {state.schedulePreferences.days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}</p>
                )}
                {state.schedulePreferences.timeBlocks.length > 0 && (
                  <p>• Times: {state.schedulePreferences.timeBlocks.map(time => time.charAt(0).toUpperCase() + time.slice(1)).join(', ')}</p>
                )}
                {state.schedulePreferences.frequency && (
                  <p>• Frequency: {state.schedulePreferences.frequency === 'flexible' ? 'Flexible' : `${state.schedulePreferences.frequency} times per week`}</p>
                )}
                {state.schedulePreferences.isFlexible && (
                  <p>• Flexible scheduling enabled</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No schedule preferences set</p>
            )}
          </div>

          {/* Budget Review */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 flex items-center mb-3">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Budget Preferences
            </h3>
            {state.budgetPreferences.amount > 0 || state.budgetPreferences.timeframe || state.budgetPreferences.flexibility ? (
              <div className="text-sm text-gray-700 space-y-1">
                {state.budgetPreferences.timeframe && (
                  <p>• Timeframe: {state.budgetPreferences.timeframe.charAt(0).toUpperCase() + state.budgetPreferences.timeframe.slice(1)}</p>
                )}
                {state.budgetPreferences.amount > 0 && (
                  <p>• Amount: ${state.budgetPreferences.amount.toLocaleString()} {state.budgetPreferences.timeframe}</p>
                )}
                {state.budgetPreferences.flexibility && (
                  <p>• Flexibility: {state.budgetPreferences.flexibility.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                )}
                {state.budgetPreferences.note && (
                  <p>• Note: {state.budgetPreferences.note}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No budget preferences set</p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col items-center space-y-4 pt-6">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-white font-medium flex items-center justify-center hover:opacity-90"
              style={{ 
                backgroundColor: '#71A37A',
                width: '358px',
                height: '54px',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              {submitting ? 'Completing...' : 'Complete Onboarding'}
            </Button>
            <Button
              type="button"
              className="text-white font-medium flex items-center justify-center hover:opacity-90"
              style={{ 
                backgroundColor: '#ffffff',
                color: '#000000',
                width: '358px',
                height: '54px',
                borderRadius: '8px',
                padding: '16px'
              }}
              onClick={goToPreviousStep}
            >
              CANCEL
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
