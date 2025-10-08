"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StepNavigation from "./StepNavigation";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2AIChat from "./Step2AIChat";
import Step3AIReview from "./Step3AIReview";
import Step4ServiceSelection from "./Step4ServiceSelection";
import Step5Schedule from "./Step5Schedule";
import Step6Budget from "./Step6Budget";
import Step7Review from "./Step7Review";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

// Types
export interface PatientBasicInfo {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  relationship: string;
  bodyType: 'small' | 'medium' | 'large';
  location: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  detectedEntities?: any;
  followUpQuestions?: string[];
}

export interface AIAnalysisResult {
  detectedConditions: string[];
  careNeeds: string[];
  suggestedServices: ServiceSuggestion[];
  confidenceScore: number;
  isComplete: boolean;
}

export interface ServiceSuggestion {
  serviceId: string;
  serviceName: string;
  level: 'full' | 'hand_on' | 'occasional' | 'light_oversight';
  confidence: number;
  aiSuggested: boolean;
  reasoning?: string;
}

export interface ServiceSelection {
  serviceId: string;
  serviceName: string;
  level: 'full' | 'hand_on' | 'occasional' | 'light_oversight';
  aiSuggested: boolean;
}

export interface SchedulePreferences {
  days: string[];
  timeBlocks: string[];
  frequency: string;
  isFlexible: boolean;
}

export interface BudgetPreferences {
  timeframe: 'weekly' | 'monthly' | 'per_visit';
  amount: number;
  flexibility: 'yes' | 'no' | 'depends_on_qualifications';
  note?: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface OnboardingState {
  currentStep: number;
  patientData: PatientBasicInfo;
  aiConversation: ChatMessage[];
  aiAnalysis: AIAnalysisResult | null;
  selectedServices: ServiceSelection[];
  schedulePreferences: SchedulePreferences;
  budgetPreferences: BudgetPreferences;
  uploadedFiles: UploadedFile[];
  isCompleted: boolean;
  validationErrors: Record<string, string[]>;
  isLoading: boolean;
  sessionId: string | null;
}

export type OnboardingAction = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_PATIENT_DATA'; payload: Partial<PatientBasicInfo> }
  | { type: 'ADD_AI_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_AI_ANALYSIS'; payload: AIAnalysisResult }
  | { type: 'UPDATE_SERVICES'; payload: ServiceSelection[] }
  | { type: 'UPDATE_SCHEDULE'; payload: Partial<SchedulePreferences> }
  | { type: 'UPDATE_BUDGET'; payload: Partial<BudgetPreferences> }
  | { type: 'ADD_UPLOADED_FILE'; payload: UploadedFile }
  | { type: 'REMOVE_UPLOADED_FILE'; payload: string }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string[]> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'COMPLETE_ONBOARDING' };

// Initial state
const initialState: OnboardingState = {
  currentStep: 1,
  patientData: {
    fullName: '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say',
    relationship: '',
    bodyType: 'medium',
    location: '',
  },
  aiConversation: [],
  aiAnalysis: null,
  selectedServices: [],
  schedulePreferences: {
    days: [],
    timeBlocks: [],
    frequency: '',
    isFlexible: false,
  },
  budgetPreferences: {
    timeframe: 'monthly',
    amount: 0,
    flexibility: 'yes',
    note: '',
  },
  uploadedFiles: [],
  isCompleted: false,
  validationErrors: {},
  isLoading: false,
  sessionId: null,
};

// Reducer
function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'UPDATE_PATIENT_DATA':
      return { ...state, patientData: { ...state.patientData, ...action.payload } };
    case 'ADD_AI_MESSAGE':
      return { ...state, aiConversation: [...state.aiConversation, action.payload] };
    case 'SET_AI_ANALYSIS':
      return { ...state, aiAnalysis: action.payload };
    case 'UPDATE_SERVICES':
      return { ...state, selectedServices: action.payload };
    case 'UPDATE_SCHEDULE':
      return { ...state, schedulePreferences: { ...state.schedulePreferences, ...action.payload } };
    case 'UPDATE_BUDGET':
      return { ...state, budgetPreferences: { ...state.budgetPreferences, ...action.payload } };
    case 'ADD_UPLOADED_FILE':
      return { ...state, uploadedFiles: [...state.uploadedFiles, action.payload] };
    case 'REMOVE_UPLOADED_FILE':
      return { ...state, uploadedFiles: state.uploadedFiles.filter(f => f.id !== action.payload) };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'RESET_ONBOARDING':
      return initialState;
    case 'COMPLETE_ONBOARDING':
      return { ...state, isCompleted: true };
    default:
      return state;
  }
}

// Context
interface OnboardingContextType {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  goToStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updatePatientData: (data: Partial<PatientBasicInfo>) => void;
  updateServices: (services: ServiceSelection[]) => void;
  updateSchedule: (schedule: Partial<SchedulePreferences>) => void;
  updateBudget: (budget: Partial<BudgetPreferences>) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (fileId: string) => void;
  setValidationErrors: (errors: Record<string, string[]>) => void;
  setLoading: (loading: boolean) => void;
  resetOnboarding: () => void;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

// Provider component
interface OnboardingProviderProps {
  children: React.ReactNode;
  familyName: string;
  userId: string;
}

function OnboardingProvider({ children, familyName, userId }: OnboardingProviderProps) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const router = useRouter();

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch('/api/patient-onboarding/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyName }),
        });
        
        if (response.ok) {
          const { sessionId } = await response.json();
          dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
        }
      } catch (error) {
        console.error('Failed to initialize onboarding session:', error);
        toast.error('Failed to start onboarding session');
      }
    };

    initializeSession();
  }, [familyName]);

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 7) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  };

  const goToNextStep = () => {
    if (state.currentStep < 7) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const goToPreviousStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  };

  const updatePatientData = (data: Partial<PatientBasicInfo>) => {
    dispatch({ type: 'UPDATE_PATIENT_DATA', payload: data });
  };

  const updateServices = (services: ServiceSelection[]) => {
    dispatch({ type: 'UPDATE_SERVICES', payload: services });
  };

  const updateSchedule = (schedule: Partial<SchedulePreferences>) => {
    dispatch({ type: 'UPDATE_SCHEDULE', payload: schedule });
  };

  const updateBudget = (budget: Partial<BudgetPreferences>) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: budget });
  };

  const addUploadedFile = (file: UploadedFile) => {
    dispatch({ type: 'ADD_UPLOADED_FILE', payload: file });
  };

  const removeUploadedFile = (fileId: string) => {
    dispatch({ type: 'REMOVE_UPLOADED_FILE', payload: fileId });
  };

  const setValidationErrors = (errors: Record<string, string[]>) => {
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const resetOnboarding = () => {
    dispatch({ type: 'RESET_ONBOARDING' });
  };

  const completeOnboarding = () => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    router.push('/family/patients');
  };

  const contextValue: OnboardingContextType = {
    state,
    dispatch,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    updatePatientData,
    updateServices,
    updateSchedule,
    updateBudget,
    addUploadedFile,
    removeUploadedFile,
    setValidationErrors,
    setLoading,
    resetOnboarding,
    completeOnboarding,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Wizard content component that uses the context
function OnboardingWizardContent() {
  const { state } = useOnboarding();

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <Step1BasicInfo />;
      case 2:
        return <Step2AIChat />;
      case 3:
        return <Step3AIReview />;
      case 4:
        return <Step4ServiceSelection />;
      case 5:
        return <Step5Schedule />;
      case 6:
        return <Step6Budget />;
      case 7:
        return <Step7Review />;
      default:
        return <Step1BasicInfo />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LoadingOverlay isVisible={state.isLoading} message="Processing..." />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Onboarding</h1>
              <p className="text-gray-600">Step {state.currentStep} of 7</p>
            </div>
            <CancelButton />
          </div>
        </div>
      </div>

      {/* Progress Navigation */}
      <StepNavigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
}

function CancelButton() {
  const { state, resetOnboarding, setLoading } = useOnboarding();
  const router = useRouter();

  const onCancel = async () => {
    if (!state.sessionId) {
      router.back();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/patient-onboarding/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId }),
      });
      if (!res.ok) {
        throw new Error('Failed to cancel session');
      }
      resetOnboarding();
      router.push('/family/patients');
    } catch (e) {
      // Fallback: still navigate away, but keep UX consistent
      resetOnboarding();
      router.push('/family/patients');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
      Cancel
    </button>
  );
}

// Main wizard component
interface PatientOnboardingWizardProps {
  familyName: string;
  userId: string;
}

export default function PatientOnboardingWizard({ familyName, userId }: PatientOnboardingWizardProps) {
  return (
    <OnboardingProvider familyName={familyName} userId={userId}>
      <OnboardingWizardContent />
    </OnboardingProvider>
  );
}
