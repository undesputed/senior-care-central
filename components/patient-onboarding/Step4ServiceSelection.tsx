"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const hasProcessedAI = useRef(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          setServices(data);
          
          // Auto-select AI-suggested services if they exist and no services are currently selected
          console.log('AI Analysis:', state.aiAnalysis);
          console.log('Suggested Services:', state.aiAnalysis?.suggestedServices);
          console.log('Selected Services:', state.selectedServices);
          console.log('Available Services:', data);
          
          if (state.aiAnalysis?.suggestedServices && state.aiAnalysis.suggestedServices.length > 0 && state.selectedServices.length === 0) {
            console.log('Attempting to auto-select AI services...');
            const aiSuggestedServices = state.aiAnalysis.suggestedServices.map(suggestion => {
              console.log('Processing suggestion:', suggestion);
              // Find the real service by name
              const realService = data.find((s: Service) => 
                s.name.toLowerCase() === suggestion.serviceName.toLowerCase()
              );
              console.log('Found real service:', realService);
              
              return {
                serviceId: realService?.id || suggestion.serviceId,
                serviceName: suggestion.serviceName,
                level: suggestion.level,
                aiSuggested: true,
              };
            }).filter(service => service.serviceId); // Only include services that were found
            
            console.log('AI Suggested Services to add:', aiSuggestedServices);
            
            if (aiSuggestedServices.length > 0) {
              updateServices(aiSuggestedServices);
              toast.success(`Pre-selected ${aiSuggestedServices.length} AI-suggested services`);
            } else {
              console.log('No services matched for auto-selection');
            }
          } else {
            console.log('Skipping auto-selection. Reasons:');
            console.log('- AI Analysis exists:', !!state.aiAnalysis);
            console.log('- Suggested Services exist:', !!state.aiAnalysis?.suggestedServices);
            console.log('- Suggested Services length:', state.aiAnalysis?.suggestedServices?.length);
            console.log('- Selected Services length:', state.selectedServices.length);
          }
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

  // Separate effect to handle AI service pre-selection when AI analysis becomes available
  useEffect(() => {
    if (services.length > 0 && 
        state.aiAnalysis?.suggestedServices && 
        state.aiAnalysis.suggestedServices.length > 0 && 
        !hasProcessedAI.current) {
      
      hasProcessedAI.current = true;
      console.log('AI Analysis available, attempting to auto-select services...');
      console.log('Available services:', services);
      console.log('AI suggested services:', state.aiAnalysis.suggestedServices);
      
      const aiSuggestedServices = state.aiAnalysis.suggestedServices.map(suggestion => {
        console.log('Processing suggestion:', suggestion);
        // Find the real service by name - try multiple matching strategies
        let realService = services.find((s: Service) => 
          s.name.toLowerCase() === suggestion.serviceName.toLowerCase()
        );
        
        // If no exact match, try converting kebab-case to title case
        if (!realService) {
          const titleCaseName = suggestion.serviceName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          realService = services.find((s: Service) => 
            s.name.toLowerCase() === titleCaseName.toLowerCase()
          );
        }
        
        // If still no match, try partial matching
        if (!realService) {
          const suggestionWords = suggestion.serviceName.toLowerCase().split('-');
          realService = services.find((s: Service) => {
            const serviceWords = s.name.toLowerCase().split(' ');
            return suggestionWords.every(word => 
              serviceWords.some(serviceWord => serviceWord.includes(word) || word.includes(serviceWord))
            );
          });
        }
        
        console.log('Found real service:', realService);
        
        return {
          serviceId: realService?.id || suggestion.serviceId,
          serviceName: realService?.name || suggestion.serviceName,
          level: suggestion.level,
          aiSuggested: true,
        };
      }).filter(service => service.serviceId); // Only include services that were found
      
      console.log('AI Suggested Services to add:', aiSuggestedServices);
      
      if (aiSuggestedServices.length > 0) {
        updateServices(aiSuggestedServices);
        toast.success(`Pre-selected ${aiSuggestedServices.length} AI-suggested services`);
      } else {
        console.log('No services matched for auto-selection');
      }
    }
  }, [services, state.aiAnalysis]);

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
      <div className="space-y-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Suggestions</h2>
        <p className="text-gray-600">
          Based on your responses, we've suggested services your loved one may need. You can accept these or make changes below.
        </p>
      </div>
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => {
              const isSelected = state.selectedServices.some(s => s.serviceId === service.id);
              const selectedService = state.selectedServices.find(s => s.serviceId === service.id);

              return (
                <div
                  key={service.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  {/* Service Checkbox */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleServiceToggle(service)}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                      style={{ 
                        accentColor: '#71A37A',
                        color: '#ffffff'
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        {state.aiAnalysis?.suggestedServices?.some(s => s.serviceName === service.name) && (
                          <Badge variant="secondary" className="text-xs">
                            AI Suggested
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Support Level Selection */}
                  {isSelected && (
                    <div className="pl-7">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Level of Support</h4>
                      <div className="space-y-2">
                        {supportLevels.map((level) => (
                          <label key={level.value} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`level-${service.id}`}
                              value={level.value}
                              checked={selectedService?.level === level.value}
                              onChange={() => handleLevelChange(service.id, level.value)}
                              className="w-4 h-4 border-gray-300 focus:ring-2"
                              style={{ 
                                accentColor: '#71A37A',
                                color: '#ffffff'
                              }}
                            />
                            <span className="text-sm text-gray-700">{level.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>


      {/* Navigation Buttons */}
      <div className="flex flex-col items-center space-y-4 pt-6">
        <Button
          onClick={onSubmit}
          disabled={saving}
          className="text-white font-medium flex items-center justify-center hover:opacity-90"
          style={{ 
            backgroundColor: '#71A37A',
            width: '358px',
            height: '54px',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          {saving ? 'Saving...' : 'NEXT →'}
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
