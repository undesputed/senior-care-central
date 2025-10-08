"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useOnboarding } from "./PatientOnboardingWizard";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { Calendar, Clock } from "lucide-react";

const schema = z.object({
  days: z.array(z.string()).min(1, "Select at least one day"),
  timeBlocks: z.array(z.string()).min(1, "Select at least one time block"),
  frequency: z.string().min(1, "Select frequency"),
  isFlexible: z.boolean(),
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

const timeBlocks = [
  { value: 'morning', label: 'Morning (6 AM - 11 AM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
  { value: 'evening', label: 'Evening (6 PM - 10 PM)' },
];

const frequencyOptions = [
  { value: '1', label: '1 time per week' },
  { value: '2', label: '2 times per week' },
  { value: '3', label: '3 times per week' },
  { value: '4', label: '4 times per week' },
  { value: '5', label: '5 times per week' },
  { value: '6', label: '6 times per week' },
  { value: '7', label: 'Daily (7 times per week)' },
  { value: 'flexible', label: 'Flexible - varies by week' },
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
      days: state.schedulePreferences.days,
      timeBlocks: state.schedulePreferences.timeBlocks,
      frequency: state.schedulePreferences.frequency,
      isFlexible: state.schedulePreferences.isFlexible,
    },
  });

  const watchedDays = watch('days');
  const watchedTimeBlocks = watch('timeBlocks');
  const watchedFrequency = watch('frequency');
  const watchedIsFlexible = watch('isFlexible');

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

  const handleTimeBlockChange = (timeBlock: string, checked: boolean) => {
    const currentTimeBlocks = watchedTimeBlocks || [];
    const newTimeBlocks = checked
      ? [...currentTimeBlocks, timeBlock]
      : currentTimeBlocks.filter(t => t !== timeBlock);
    setValue('timeBlocks', newTimeBlocks);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-green-600" />
          Care Schedule
        </CardTitle>
        <p className="text-gray-600">
          Specify when and how often care is needed.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Days of the Week */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Days of the Week <span className="text-red-500">*</span>
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

          {/* Time Blocks */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Time Blocks <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              {timeBlocks.map((timeBlock) => (
                <div key={timeBlock.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={timeBlock.value}
                    checked={watchedTimeBlocks?.includes(timeBlock.value) || false}
                    onCheckedChange={(checked) => handleTimeBlockChange(timeBlock.value, checked as boolean)}
                  />
                  <Label htmlFor={timeBlock.value} className="text-sm">
                    {timeBlock.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.timeBlocks && (
              <p className="text-sm text-red-600">{errors.timeBlocks.message}</p>
            )}
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Frequency <span className="text-red-500">*</span>
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

          {/* Flexible Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="flexible"
              checked={watchedIsFlexible}
              onCheckedChange={(checked) => setValue('isFlexible', checked as boolean)}
            />
            <Label htmlFor="flexible" className="text-sm">
              I&apos;m flexible with scheduling and can work with caregiver availability
            </Label>
          </div>

          {/* Schedule Summary */}
          {(watchedDays?.length > 0 || watchedTimeBlocks?.length > 0 || watchedFrequency) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Schedule Summary</h3>
              <div className="text-sm text-green-800 space-y-1">
                {watchedDays?.length > 0 && (
                  <p>• Days: {watchedDays.map(day => daysOfWeek.find(d => d.value === day)?.label).join(', ')}</p>
                )}
                {watchedTimeBlocks?.length > 0 && (
                  <p>• Times: {watchedTimeBlocks.map(time => timeBlocks.find(t => t.value === time)?.label).join(', ')}</p>
                )}
                {watchedFrequency && (
                  <p>• Frequency: {frequencyOptions.find(f => f.value === watchedFrequency)?.label}</p>
                )}
                {watchedIsFlexible && (
                  <p>• Flexible scheduling enabled</p>
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
              Continue to Budget
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
