"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOnboarding } from "./PatientOnboardingWizard";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Heart, CheckCircle } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
}

const supportLevels = [
  { value: 'full', label: 'Full Support', description: 'Complete assistance needed' },
  { value: 'hand_on', label: 'Hands-on Help', description: 'Physical assistance required' },
  { value: 'occasional', label: 'Occasional Help', description: 'Help when needed' },
  { value: 'light_oversight', label: 'Light Oversight', description: 'Supervision and guidance' },
];

export default function Step4ServiceSelection() {
  const { state, updateServices, goToNextStep, goToPreviousStep } = useOnboarding();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleServiceToggle = (service: Service) => {
    const existingIndex = state.selectedServices.findIndex(s => s.serviceId === service.id);
    const newServices = [...state.selectedServices];

    if (existingIndex >= 0) {
      // Remove service
      newServices.splice(existingIndex, 1);
    } else {
      // Add service with default level
      newServices.push({
        serviceId: service.id,
        serviceName: service.name,
        level: 'full',
        aiSuggested: false,
      });
    }

    updateServices(newServices);
  };

  const handleLevelChange = (serviceId: string, level: string) => {
    const newServices = state.selectedServices.map(service =>
      service.serviceId === serviceId
        ? { ...service, level: level as 'full' | 'hand_on' | 'occasional' | 'light_oversight' }
        : service
    );
    updateServices(newServices);
  };

  const onSubmit = async () => {
    if (state.selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/patient-onboarding/save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 4,
          data: { selectedServices: state.selectedServices },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save service selection');
      }

      toast.success("Service selection saved!");
      goToNextStep();
    } catch (error) {
      console.error('Error saving services:', error);
      toast.error("Failed to save services. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <Heart className="w-6 h-6 mr-2 text-green-600" />
          Select Care Services
        </CardTitle>
        <p className="text-gray-600">
          Choose the services your patient needs and specify the level of support required.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
              const isSelected = state.selectedServices.some(s => s.serviceId === service.id);
              const selectedService = state.selectedServices.find(s => s.serviceId === service.id);

              return (
                <div
                  key={service.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleServiceToggle(service)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        {state.aiAnalysis?.suggestedServices.some(s => s.serviceName === service.name) && (
                          <Badge variant="secondary" className="text-xs">
                            AI Suggested
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ml-2 ${
                      isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                  </div>

                  {service.category && (
                    <Badge variant="secondary" className="text-xs">
                      {service.category}
                    </Badge>
                  )}

                  {/* Support Level Selection */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Support Level:
                      </label>
                      <select
                        value={selectedService?.level || 'full'}
                        onChange={(e) => handleLevelChange(service.id, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {supportLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {supportLevels.find(l => l.value === selectedService?.level)?.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Services Summary */}
          {state.selectedServices.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">
                Selected Services ({state.selectedServices.length})
              </h3>
              <div className="space-y-1">
                {state.selectedServices.map((service) => (
                  <div key={service.serviceId} className="text-sm text-green-800">
                    • {service.serviceName} - {supportLevels.find(l => l.value === service.level)?.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              className="border-gray-300"
            >
              Previous
            </Button>
            <LoadingButton
              onClick={onSubmit}
              loading={saving}
              loadingText="Saving..."
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Continue to Schedule
            </LoadingButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
