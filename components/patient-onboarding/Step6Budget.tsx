"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOnboarding } from "./PatientOnboardingWizard";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";

const schema = z.object({
  budgetRange: z.enum(['under_15k', '15k_25k', '25k_40k', '40k_plus', 'flexible']),
  note: z.string().max(150, "Note must be 150 characters or less").optional(),
});

type FormValues = z.infer<typeof schema>;

const budgetRangeOptions = [
  { value: 'under_15k', label: 'Under $15,000/month' },
  { value: '15k_25k', label: '$15,000-25,000/month' },
  { value: '25k_40k', label: '$25,000-40,000/month' },
  { value: '40k_plus', label: '$40,000+/month' },
  { value: 'flexible', label: 'Flexible / Discuss during consultation' },
];

export default function Step6Budget() {
  const { state, updateBudget, goToNextStep, goToPreviousStep } = useOnboarding();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      budgetRange: state.budgetPreferences.budgetRange || 'flexible',
      note: state.budgetPreferences.note || '',
    },
  });

  const watchedBudgetRange = watch('budgetRange');
  const watchedNote = watch('note');

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      // Update context state
      updateBudget(data);
      
      // Save to backend
      const response = await fetch('/api/patient-onboarding/save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 6,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save budget preferences');
      }

      toast.success("Budget preferences saved!");
      goToNextStep();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error("Failed to save budget. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Budget</h2>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Verified Providers Only:</span>
          <div className="flex space-x-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">HR</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">MO</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Budget Range Selection */}
        <div className="space-y-3">
          <RadioGroup
            value={watchedBudgetRange}
            onValueChange={(value) => setValue('budgetRange', value as any)}
          >
            {budgetRangeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.budgetRange && (
            <p className="text-sm text-red-600">{errors.budgetRange.message}</p>
          )}
        </div>

        {/* Optional Note */}
        <div className="space-y-2">
          <Label htmlFor="note" className="text-sm font-medium">
            Additional Notes (Optional)
          </Label>
          <Textarea
            id="note"
            placeholder="Any additional information about your budget or financial situation..."
            {...register("note")}
            className="min-h-[80px] resize-none"
            maxLength={150}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Help caregivers understand your budget constraints</span>
            <span>{watchedNote?.length || 0}/150</span>
          </div>
          {errors.note && (
            <p className="text-sm text-red-600">{errors.note.message}</p>
          )}
        </div>

        {/* Budget Summary */}
        {watchedBudgetRange && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Budget Summary</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>• Range: {budgetRangeOptions.find(r => r.value === watchedBudgetRange)?.label}</p>
              {watchedNote && (
                <p>• Note: {watchedNote}</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col items-center space-y-4 pt-6">
          <Button
            type="submit"
            disabled={loading}
            className="text-white font-medium flex items-center justify-center hover:opacity-90"
            style={{ 
              backgroundColor: '#71A37A',
              width: '358px',
              height: '54px',
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            {loading ? 'Saving...' : 'NEXT →'}
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
      </form>
    </div>
  );
}
