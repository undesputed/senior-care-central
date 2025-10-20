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
  dateOfBirth: z.string().min(1, "Date of birth is required").refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date < new Date();
  }, {
    message: "Please enter a valid date in the past"
  }),
  age: z.number().min(0, "Age must be a positive number"),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).refine((val) => val !== undefined, {
    message: "Please select a gender"
  }),
  relationship: z.string().min(1, "Relationship is required"),
  bodyType: z.enum(['small', 'medium', 'large']).refine((val) => val !== undefined, {
    message: "Please select a body type"
  }),
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
    mode: "onChange",
    defaultValues: {
      fullName: state.patientData.fullName,
      dateOfBirth: state.patientData.dateOfBirth,
      age: 0, // Will be calculated from dateOfBirth
      gender: state.patientData.gender,
      relationship: state.patientData.relationship,
      bodyType: state.patientData.bodyType,
      location: state.patientData.location,
    },
  });

  const watchedValues = watch();

  // Function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Watch date of birth and auto-calculate age
  const dateOfBirth = watch("dateOfBirth");
  React.useEffect(() => {
    if (dateOfBirth) {
      const calculatedAge = calculateAge(dateOfBirth);
      setValue("age", calculatedAge);
    }
  }, [dateOfBirth, setValue]);

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
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
        <div className="space-y-6 w-full flex flex-col items-center">
            {/* Patient Name */}
            <div className="flex flex-col items-center">
              <Input
                id="fullName"
                type="text"
                placeholder="Patient name"
                {...register("fullName")}
                className={`${errors.fullName ? "border-red-500" : ""} bg-white rounded-lg`}
                style={{
                  width: '358px',
                  height: '54px',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              />
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col items-center">
              <Input
                id="dateOfBirth"
                type="date"
                placeholder="Date of birth"
                {...register("dateOfBirth")}
                className={`${errors.dateOfBirth ? "border-red-500" : ""} bg-white rounded-lg`}
                style={{
                  width: '358px',
                  height: '54px',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            {/* Patient Age (Auto-calculated) */}
            <div className="flex justify-center">
              <Input
                id="age"
                type="number"
                placeholder="Age (auto-calculated)"
                value={watchedValues.age || ''}
                readOnly
                className="bg-gray-100 rounded-lg cursor-not-allowed"
                style={{
                  width: '358px',
                  height: '54px',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              />
            </div>

            {/* Patient Gender */}
            <div className="flex flex-col items-center">
              <Select
                value={watchedValues.gender}
                onValueChange={(value) => setValue("gender", value as any)}
              >
                <SelectTrigger 
                  className={`${errors.gender ? "border-red-500" : ""} bg-white rounded-lg`}
                  style={{
                    width: '358px',
                    height: '54px',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <SelectValue placeholder="Patient gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
              )}
            </div>

            {/* Relationship with patient */}
            <div className="flex flex-col items-center">
              <Select
                value={watchedValues.relationship}
                onValueChange={(value) => setValue("relationship", value)}
              >
                <SelectTrigger 
                  className={`${errors.relationship ? "border-red-500" : ""} bg-white rounded-lg`}
                  style={{
                    width: '358px',
                    height: '54px',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <SelectValue placeholder="Relationship with patient (e.g., parent, spouse)" />
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
                <p className="text-sm text-red-600 mt-1">{errors.relationship.message}</p>
              )}
            </div>

            {/* Body type */}
            <div className="flex flex-col items-center">
              <Select
                value={watchedValues.bodyType}
                onValueChange={(value) => setValue("bodyType", value as any)}
              >
                <SelectTrigger 
                  className={`${errors.bodyType ? "border-red-500" : ""} bg-white rounded-lg`}
                  style={{
                    width: '358px',
                    height: '54px',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <SelectValue placeholder="Body type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (under 120 lbs)</SelectItem>
                  <SelectItem value="medium">Medium (120-200 lbs)</SelectItem>
                  <SelectItem value="large">Large (over 200 lbs)</SelectItem>
                </SelectContent>
              </Select>
              {errors.bodyType && (
                <p className="text-sm text-red-600 mt-1">{errors.bodyType.message}</p>
              )}
            </div>

            {/* Zip code or Location */}
            <div className="flex flex-col items-center">
              <LocationAutocomplete
                id="location"
                value={watch("location")}
                onChange={(value) => setValue("location", value)}
                placeholder="Zip code or Location"
                className={`${errors.location ? "border-red-500" : ""} bg-white rounded-lg`}
                style={{
                  width: '358px',
                  height: '54px',
                  borderRadius: '8px',
                  padding: '16px'
                }}
                onError={(error) => toast.error(error)}
              />
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
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
            >
              CANCEL
            </Button>
          </div>
        </form>
      </div>
  );
}
