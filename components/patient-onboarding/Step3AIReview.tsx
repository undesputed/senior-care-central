"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "./PatientOnboardingWizard";
import { toast } from "sonner";

export default function Step3AIReview() {
  const { state, goToNextStep, goToPreviousStep, updateServices } = useOnboarding();
  const [isProcessing, setIsProcessing] = useState(false);
  const [services, setServices] = useState<Array<{id: string, name: string}>>([]);

  // Load services to map names to UUIDs
  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, []);

  const handleAcceptSuggestions = () => {
    if (!state.aiAnalysis) return;

    // Convert AI suggestions to service selections, mapping names to UUIDs
    const selectedServices = state.aiAnalysis.suggestedServices.map(suggestion => {
      // Find the real service UUID by name
      const realService = services.find(s => 
        s.name.toLowerCase() === suggestion.serviceName.toLowerCase()
      );
      
      return {
        serviceId: realService?.id || suggestion.serviceId, // Use real UUID or fallback
        serviceName: suggestion.serviceName,
        level: suggestion.level,
        aiSuggested: true,
      };
    });

    updateServices(selectedServices);
    toast.success("AI suggestions accepted!");
    goToNextStep();
  };

  const handleModifySuggestions = () => {
    toast.info("You can modify the suggestions in the next step");
    goToNextStep();
  };

  const handleRejectSuggestions = () => {
    updateServices([]);
    toast.info("AI suggestions rejected. You can manually select services in the next step.");
    goToNextStep();
  };

  if (!state.aiAnalysis) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Detected Entities</h2>
          <p className="text-gray-600">
            No AI analysis available. You can proceed to manually select services.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col items-center space-y-4 pt-6">
          <Button
            onClick={goToNextStep}
            className="text-white font-medium flex items-center justify-center hover:opacity-90"
            style={{ 
              backgroundColor: '#71A37A',
              width: '358px',
              height: '54px',
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            NEXT →
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
    );
  }

  const { detectedConditions, careNeeds, suggestedServices, confidenceScore } = state.aiAnalysis;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Detected Entities</h2>
      </div>

      {/* Patient Summary */}
      {state.aiAnalysis.patientSummary && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Patient Summary</h3>
          <p className="text-gray-800 leading-relaxed">
            {state.aiAnalysis.patientSummary}
          </p>
        </div>
      )}

      {/* Detected Conditions */}
      {detectedConditions.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Detected Medical Conditions</h3>
          <div className="flex flex-wrap gap-2">
            {detectedConditions.map((condition, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Care Needs */}
      {careNeeds.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Identified Care Needs</h3>
          <div className="space-y-2">
            {careNeeds.map((need, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-800">{need}</span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Action Buttons */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">What would you like to do?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={handleAcceptSuggestions}
            className="text-white"
            style={{ backgroundColor: '#71A37A', borderColor: '#71A37A' }}
          >
            Accept All Suggestions
          </Button>
          <Button
            onClick={handleModifySuggestions}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Modify Suggestions
          </Button>
          <Button
            onClick={handleRejectSuggestions}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Reject & Select Manually
          </Button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col items-center space-y-4 pt-6">
        <Button
          onClick={goToNextStep}
          className="text-white font-medium flex items-center justify-center hover:opacity-90"
          style={{ 
            backgroundColor: '#71A37A',
            width: '358px',
            height: '54px',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          NEXT →
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
  );
}