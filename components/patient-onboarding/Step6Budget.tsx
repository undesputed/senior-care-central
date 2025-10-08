"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOnboarding } from "./PatientOnboardingWizard";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

const schema = z.object({
  timeframe: z.enum(['weekly', 'monthly', 'per_visit']),
  amount: z.number().min(0, "Amount must be positive").max(999999, "Amount too large"),
  flexibility: z.enum(['yes', 'no', 'depends_on_qualifications']),
  note: z.string().max(150, "Note must be 150 characters or less").optional(),
});

type FormValues = z.infer<typeof schema>;

const timeframeOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'per_visit', label: 'Per Visit' },
];

const flexibilityOptions = [
  { value: 'yes', label: 'Yes, I can be flexible with pricing' },
  { value: 'no', label: 'No, I need to stay within my budget' },
  { value: 'depends_on_qualifications', label: 'Depends on caregiver qualifications and experience' },
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
      timeframe: state.budgetPreferences.timeframe,
      amount: state.budgetPreferences.amount,
      flexibility: state.budgetPreferences.flexibility,
      note: state.budgetPreferences.note || '',
    },
  });

  const watchedTimeframe = watch('timeframe');
  const watchedAmount = watch('amount');
  const watchedFlexibility = watch('flexibility');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-600" />
          Budget Preferences
        </CardTitle>
        <p className="text-gray-600">
          Set your care budget and indicate how flexible you are with pricing.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Budget Timeframe */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Budget Timeframe <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={watchedTimeframe}
              onValueChange={(value) => setValue('timeframe', value as any)}
            >
              {timeframeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.timeframe && (
              <p className="text-sm text-red-600">{errors.timeframe.message}</p>
            )}
          </div>

          {/* Budget Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Budget Amount (USD) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                {...register("amount", { valueAsNumber: true })}
                className="pl-8"
                min="0"
                max="999999"
                step="1"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
            {watchedAmount > 0 && (
              <p className="text-sm text-gray-600">
                {formatCurrency(watchedAmount)} {watchedTimeframe}
              </p>
            )}
          </div>

          {/* Flexibility */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Are you flexible with pricing? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={watchedFlexibility}
              onValueChange={(value) => setValue('flexibility', value as any)}
            >
              {flexibilityOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <Label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.flexibility && (
              <p className="text-sm text-red-600">{errors.flexibility.message}</p>
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
          {(watchedTimeframe || watchedAmount > 0 || watchedFlexibility) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Budget Summary</h3>
              <div className="text-sm text-green-800 space-y-1">
                {watchedTimeframe && (
                  <p>• Timeframe: {timeframeOptions.find(t => t.value === watchedTimeframe)?.label}</p>
                )}
                {watchedAmount > 0 && (
                  <p>• Amount: {formatCurrency(watchedAmount)} {watchedTimeframe}</p>
                )}
                {watchedFlexibility && (
                  <p>• Flexibility: {flexibilityOptions.find(f => f.value === watchedFlexibility)?.label}</p>
                )}
                {watchedNote && (
                  <p>• Note: {watchedNote}</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              className="border-gray-300"
            >
              Previous
            </Button>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Saving..."
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Continue to Review
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
