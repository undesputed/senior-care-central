"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useOnboarding } from "./PatientOnboardingWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButton } from "@/components/ui/loading-button";
import LocationAutocomplete from "@/components/ui/location-autocomplete";
import { toast } from "sonner";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  relationship: z.string().min(1, "Relationship is required"),
  bodyType: z.enum(['small', 'medium', 'large']),
  location: z.string().min(1, "Location is required"),
});

type FormValues = z.infer<typeof schema>;

export default function Step1BasicInfo() {
  const { state, updatePatientData, goToNextStep, setValidationErrors } = useOnboarding();
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
      fullName: state.patientData.fullName,
      dateOfBirth: state.patientData.dateOfBirth,
      gender: state.patientData.gender,
      relationship: state.patientData.relationship,
      bodyType: state.patientData.bodyType,
      location: state.patientData.location,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      // Update context state
      updatePatientData(data);
      
      // Clear validation errors
      setValidationErrors({});
      
      // Save to backend
      const response = await fetch('/api/patient-onboarding/save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 1,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save step 1 data');
      }

      toast.success("Basic information saved!");
      goToNextStep();
    } catch (error) {
      console.error('Error saving step 1:', error);
      toast.error("Failed to save information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    setValidationErrors(errors);
    toast.error("Please fix the errors below");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">Patient Basic Information</CardTitle>
        <p className="text-gray-600">
          Let's start with the basic details about the person needing care.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter full name"
                {...register("fullName")}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
                className={errors.dateOfBirth ? "border-red-500" : ""}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-medium">
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedValues.gender}
                onValueChange={(value) => setValue("gender", value as any)}
              >
                <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>

            {/* Relationship */}
            <div className="space-y-2">
              <Label htmlFor="relationship" className="text-sm font-medium">
                Relationship <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedValues.relationship}
                onValueChange={(value) => setValue("relationship", value)}
              >
                <SelectTrigger className={errors.relationship ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="grandparent">Grandparent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="other_family">Other Family Member</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.relationship && (
                <p className="text-sm text-red-600">{errors.relationship.message}</p>
              )}
            </div>

            {/* Body Type */}
            <div className="space-y-2">
              <Label htmlFor="bodyType" className="text-sm font-medium">
                Body Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedValues.bodyType}
                onValueChange={(value) => setValue("bodyType", value as any)}
              >
                <SelectTrigger className={errors.bodyType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (under 120 lbs)</SelectItem>
                  <SelectItem value="medium">Medium (120-200 lbs)</SelectItem>
                  <SelectItem value="large">Large (over 200 lbs)</SelectItem>
                </SelectContent>
              </Select>
              {errors.bodyType && (
                <p className="text-sm text-red-600">{errors.bodyType.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Location <span className="text-red-500">*</span>
              </Label>
              <LocationAutocomplete
                id="location"
                value={watch("location")}
                onChange={(value) => setValue("location", value)}
                placeholder="City, State or ZIP code"
                className={errors.location ? "border-red-500" : ""}
                onError={(error) => toast.error(error)}
              />
              {errors.location && (
                <p className="text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Saving..."
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              Continue to AI Chat
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
