"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "./PatientOnboardingWizard";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";

const schema = z.object({
  days: z.array(z.string()).min(1, "Select at least one day"),
  time: z.string().min(1, "Select time"),
  frequency: z.string().min(1, "Select frequency"),
});

type FormValues = z.infer<typeof schema>;

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const timeOptions = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
];

const frequencyOptions = [
  { value: '1', label: '1 Session' },
  { value: '2', label: '2 Sessions' },
  { value: '3', label: '3 Sessions' },
];

export default function Step5Schedule() {
  const { state, updateSchedule, goToNextStep, goToPreviousStep } = useOnboarding();
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
      days: state.schedulePreferences.days || [],
      time: state.schedulePreferences.time || '',
      frequency: state.schedulePreferences.frequency || '',
    },
  });

  const watchedDays = watch('days');
  const watchedTime = watch('time');
  const watchedFrequency = watch('frequency');

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      // Update context state
      updateSchedule(data);
      
      // Save to backend
      const response = await fetch('/api/patient-onboarding/save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 5,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save schedule preferences');
      }

      toast.success("Schedule preferences saved!");
      goToNextStep();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error("Failed to save schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (day: string, checked: boolean) => {
    const currentDays = watchedDays || [];
    const newDays = checked
      ? [...currentDays, day]
      : currentDays.filter(d => d !== day);
    setValue('days', newDays);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Add Schedule</h2>
        <p className="text-gray-600">
          Specify when and how often care is needed.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Days of the Week */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Day/s of the week
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {daysOfWeek.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={day.value}
                  checked={watchedDays?.includes(day.value) || false}
                  onCheckedChange={(checked) => handleDayChange(day.value, checked as boolean)}
                />
                <Label htmlFor={day.value} className="text-sm">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
          {errors.days && (
            <p className="text-sm text-red-600">{errors.days.message}</p>
          )}
        </div>

        {/* Time */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Time
          </Label>
          <RadioGroup
            value={watchedTime}
            onValueChange={(value) => setValue('time', value)}
          >
            {timeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.time && (
            <p className="text-sm text-red-600">{errors.time.message}</p>
          )}
        </div>

        {/* Frequency per Week */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Frequency per Week
          </Label>
          <RadioGroup
            value={watchedFrequency}
            onValueChange={(value) => setValue('frequency', value)}
          >
            {frequencyOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.frequency && (
            <p className="text-sm text-red-600">{errors.frequency.message}</p>
          )}
        </div>

        {/* Schedule Summary */}
        {(watchedDays?.length > 0 || watchedTime || watchedFrequency) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Schedule Summary</h3>
            <div className="text-sm text-green-800 space-y-1">
              {watchedDays?.length > 0 && (
                <p>• Days: {watchedDays.map(day => daysOfWeek.find(d => d.value === day)?.label).join(', ')}</p>
              )}
              {watchedTime && (
                <p>• Time: {timeOptions.find(t => t.value === watchedTime)?.label}</p>
              )}
              {watchedFrequency && (
                <p>• Frequency: {frequencyOptions.find(f => f.value === watchedFrequency)?.label}</p>
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
