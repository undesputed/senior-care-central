"use client";

import React from "react";
import { useOnboarding } from "./PatientOnboardingWizard";
import { Check } from "lucide-react";

const steps = [
  { id: 1, name: "Patient Details", description: "Patient personal details" },
  { id: 2, name: "More Details", description: "Describe care needs" },
  { id: 3, name: "Detected Entities", description: "Review AI suggestions" },
  { id: 4, name: "Suggestions", description: "Select care services" },
  { id: 5, name: "Budget", description: "Set care schedule" },
  { id: 6, name: "Add Schedule", description: "Set budget range" },
  { id: 7, name: "Review", description: "Final review & submit" },
];

export default function StepNavigation() {
  const { state, goToStep } = useOnboarding();

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-center py-6">
          {/* Tab Header with specified dimensions */}
          <div className="inline-flex bg-gray-100 rounded-lg overflow-hidden border border-gray-300" style={{ width: '1184px', height: '56px' }}>
            {steps.map((step, index) => {
              const isCompleted = state.currentStep > step.id;
              const isCurrent = state.currentStep === step.id;
              const isClickable = state.currentStep >= step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && goToStep(step.id)}
                  disabled={!isClickable}
                  className={`flex-1 flex items-center justify-center text-base font-medium h-full transition-all duration-200 ${
                    isCurrent || isCompleted
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{ 
                    width: '198px',
                    height: '56px',
                    borderRadius: index === 0 ? '8px 0 0 8px' : index === steps.length - 1 ? '0 8px 8px 0' : '0',
                    backgroundColor: isCurrent || isCompleted ? '#71A37A' : 'transparent'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {isCompleted && <Check className="w-4 h-4" />}
                    <span>{step.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
  );
}
