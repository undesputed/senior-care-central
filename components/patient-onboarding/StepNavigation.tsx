"use client";

import React from "react";
import { useOnboarding } from "./PatientOnboardingWizard";
import { Check } from "lucide-react";

const steps = [
  { id: 1, name: "Basic Info", description: "Patient personal details" },
  { id: 2, name: "AI Chat", description: "Describe care needs" },
  { id: 3, name: "AI Review", description: "Review AI suggestions" },
  { id: 4, name: "Services", description: "Select care services" },
  { id: 5, name: "Schedule", description: "Set care schedule" },
  { id: 6, name: "Budget", description: "Set budget range" },
  { id: 7, name: "Review", description: "Final review & submit" },
];

export default function StepNavigation() {
  const { state, goToStep } = useOnboarding();

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-6">
          {/* Desktop: Full step list */}
          <div className="hidden lg:flex items-center space-x-6 flex-1">
            {steps.map((step) => {
              const isCompleted = state.currentStep > step.id;
              const isCurrent = state.currentStep === step.id;
              const isClickable = state.currentStep >= step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && goToStep(step.id)}
                  disabled={!isClickable}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isCurrent
                      ? 'text-green-600 bg-green-50'
                      : isCompleted
                      ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                      isCurrent
                        ? 'border-green-600 bg-green-600 text-white'
                        : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-gray-500 leading-tight">{step.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Medium screens: Show 3-4 steps */}
          <div className="hidden md:flex lg:hidden items-center space-x-4 flex-1">
            {steps.slice(0, 4).map((step) => {
              const isCompleted = state.currentStep > step.id;
              const isCurrent = state.currentStep === step.id;
              const isClickable = state.currentStep >= step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && goToStep(step.id)}
                  disabled={!isClickable}
                  className={`flex items-center space-x-2 px-2 py-1 rounded-lg transition-all duration-200 ${
                    isCurrent
                      ? 'text-green-600 bg-green-50'
                      : isCompleted
                      ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                      isCurrent
                        ? 'border-green-600 bg-green-600 text-white'
                        : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-medium text-xs">{step.name}</div>
                    <div className="text-xs text-gray-500 leading-tight">{step.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile: Current step only */}
          <div className="md:hidden flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
              {state.currentStep}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {steps[state.currentStep - 1]?.name}
              </div>
              <div className="text-xs text-gray-500">
                {steps[state.currentStep - 1]?.description}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="hidden md:block w-32">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(state.currentStep / 7) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">
              {Math.round((state.currentStep / 7) * 100)}% Complete
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
