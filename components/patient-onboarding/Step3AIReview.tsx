"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOnboarding } from "./PatientOnboardingWizard";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Brain, CheckCircle, AlertCircle, Heart, Activity, Shield } from "lucide-react";

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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-green-600" />
            AI Analysis Review
          </CardTitle>
          <p className="text-gray-600">
            No AI analysis available. You can proceed to manually select services.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              className="border-gray-300"
            >
              Previous
            </Button>
            <Button
              onClick={goToNextStep}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Continue to Services
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { detectedConditions, careNeeds, suggestedServices, confidenceScore } = state.aiAnalysis;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-green-600" />
          AI Analysis Review
        </CardTitle>
        <p className="text-gray-600">
          Review the AI's analysis of your loved one's condition and suggested care services.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Confidence Score */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Analysis Confidence</h3>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div className="flex-1 bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${confidenceScore * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-blue-800">
                {Math.round(confidenceScore * 100)}%
              </span>
            </div>
          </div>

          {/* Detected Conditions */}
          {detectedConditions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-900">Detected Medical Conditions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {detectedConditions.map((condition, index) => (
                  <Badge key={index} variant="destructive" className="text-sm">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Care Needs */}
          {careNeeds.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Heart className="w-5 h-5 text-orange-600" />
                <h3 className="font-medium text-orange-900">Identified Care Needs</h3>
              </div>
              <div className="space-y-2">
                {careNeeds.map((need, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-orange-800">{need}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Services */}
          {suggestedServices.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">AI-Suggested Care Services</h3>
              </div>
              <div className="space-y-3">
                {suggestedServices.map((service, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{service.serviceName}</h4>
                          <Badge variant="secondary" className="text-xs">
                            AI Suggested
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Level: {service.level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Confidence: {Math.round(service.confidence * 100)}%
                        </p>
                        {service.reasoning && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            "{service.reasoning}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">What would you like to do?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={handleAcceptSuggestions}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept All Suggestions
              </Button>
              <Button
                onClick={handleModifySuggestions}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
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
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              className="border-gray-300"
            >
              Previous
            </Button>
            <Button
              onClick={goToNextStep}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Continue to Services
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}