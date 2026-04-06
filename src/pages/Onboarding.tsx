import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { saveOnboardingProfile } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Stage1Form } from '@/components/onboarding/Stage1Form';
import { Stage2Form } from '@/components/onboarding/Stage2Form';
import { Stage3Form } from '@/components/onboarding/Stage3Form';
import { Stage4Form } from '@/components/onboarding/Stage4Form';
import { Stage5Form } from '@/components/onboarding/Stage5Form';
import { Stage6Form } from '@/components/onboarding/Stage6Form';

interface OnboardingData {
  // Stage 1
  full_name?: string;
  age?: number;
  gender?: string;
  weight?: number;

  // Stage 2
  diabetes_type?: string;
  years_since_diagnosis?: number;
  insulin_usage?: boolean;
  insulin_type?: string;
  insulin_dosage_range?: string;
  insulin_schedule?: string[];

  // Stage 3
  monitoring_mode?: string;
  cgm_brand?: string;
  reading_frequency?: string;

  // Stage 4
  meal_times?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  skip_meals?: boolean;
  diet_type?: string;
  activity_level?: string;
  exercise_frequency?: string;
  sleep_start_time?: string;
  sleep_end_time?: string;

  // Stage 5
  hypo_frequency?: string;
  hypo_timing?: string[];
  alert_preference?: string;

  // Stage 6
  medical_summary?: string;
  prescription_summary?: string;
}

type OnboardingPatch = Partial<OnboardingData>;

const STAGES = [
  { number: 1, title: 'Basic Profile', description: 'Tell us about yourself' },
  { number: 2, title: 'Diabetes Profile', description: 'Your diabetes details' },
  { number: 3, title: 'Monitoring', description: 'How you monitor glucose' },
  { number: 4, title: 'Lifestyle', description: 'Your daily habits' },
  { number: 5, title: 'Risk Profile', description: 'Hypoglycemia & alerts' },
  { number: 6, title: 'Medical Data', description: 'Optional medical records' },
];

const SAVE_TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: PromiseLike<T>, message: string, timeoutMs = SAVE_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setOnboardingComplete } = useAuth();
  const [currentStage, setCurrentStage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({});

  const progress = (currentStage / STAGES.length) * 100;

  const updateData = useCallback((newData: OnboardingPatch) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  const handleSaveAndContinue = async (stageData: OnboardingPatch) => {
    updateData(stageData);
    setCurrentStage((prev) => prev + 1);
  };

  const handleBackClick = () => {
    if (currentStage === 1) {
      navigate('/dashboard');
    } else {
      setCurrentStage((prev) => prev - 1);
    }
  };

  const handleStage6Skip = async () => {
    await completeOnboarding(data);
  };

  const handleStage6Submit = async (stageData: OnboardingPatch) => {
    await completeOnboarding({ ...data, ...stageData });
  };

  const completeOnboarding = async (finalData: OnboardingData) => {
    if (!user?.id) {
      toast({
        title: 'Session error',
        description: 'Please sign in again and retry onboarding.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const updatePayload = {
        full_name: toOptionalString(finalData.full_name),
        age: toOptionalNumber(finalData.age),
        gender: toOptionalString(finalData.gender) ?? null,
        weight: toOptionalNumber(finalData.weight),
        diabetes_type: toOptionalString(finalData.diabetes_type),
        years_since_diagnosis: toOptionalNumber(finalData.years_since_diagnosis),
        insulin_usage: Boolean(finalData.insulin_usage),
        insulin_type: toOptionalString(finalData.insulin_type) ?? null,
        insulin_dosage_range: toOptionalString(finalData.insulin_dosage_range) ?? null,
        insulin_schedule: finalData.insulin_schedule || [],
        monitoring_mode: toOptionalString(finalData.monitoring_mode),
        cgm_brand: toOptionalString(finalData.cgm_brand) ?? null,
        reading_frequency: toOptionalString(finalData.reading_frequency) ?? null,
        meal_times: finalData.meal_times || {},
        skip_meals: finalData.skip_meals || false,
        diet_type: toOptionalString(finalData.diet_type) ?? null,
        activity_level: toOptionalString(finalData.activity_level) ?? null,
        exercise_frequency: toOptionalString(finalData.exercise_frequency) ?? null,
        sleep_start_time: toOptionalString(finalData.sleep_start_time) ?? null,
        sleep_end_time: toOptionalString(finalData.sleep_end_time) ?? null,
        hypo_frequency: toOptionalString(finalData.hypo_frequency) ?? null,
        hypo_timing: finalData.hypo_timing || [],
        alert_preference: toOptionalString(finalData.alert_preference) ?? null,
        medical_summary: toOptionalString(finalData.medical_summary) ?? null,
        prescription_summary: toOptionalString(finalData.prescription_summary) ?? null,
        onboarding_completed: true,
      };

      try {
        await withTimeout(
          saveOnboardingProfile(updatePayload),
          'Saving profile timed out. Please retry in a moment.'
        );
      } catch (saveError) {
        console.error('Error saving onboarding:', saveError);
        const errorMessage = saveError instanceof Error ? saveError.message : 'Failed to save your profile. Please try again.';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      setOnboardingComplete(true);

      toast({
        title: 'Welcome!',
        description: 'Your profile has been set up successfully.',
      });

      // Navigate immediately after a confirmed save.
      // The auth context is already updated optimistically, so we don't wait on a follow-up read.
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="border-b border-border/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">HypoShield Setup</h1>
              <p className="text-sm text-muted-foreground">Step {currentStage} of 6</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {STAGES[currentStage - 1]?.title}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Stage Indicator */}
        <div className="flex gap-2 mb-12 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <div key={stage.number} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  stage.number === currentStage
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : stage.number < currentStage
                    ? 'bg-success text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {stage.number < currentStage ? '✓' : stage.number}
              </div>
              {stage.number < STAGES.length && (
                <div
                  className={`w-8 h-1 mx-1 ${
                    stage.number < currentStage ? 'bg-success' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="glass rounded-2xl p-8 mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-2">{STAGES[currentStage - 1]?.title}</h2>
              <p className="text-muted-foreground mb-6">
                {STAGES[currentStage - 1]?.description}
              </p>

              {currentStage === 1 && (
                <Stage1Form initialData={data} onNext={handleSaveAndContinue} />
              )}
              {currentStage === 2 && (
                <Stage2Form initialData={data} onNext={handleSaveAndContinue} />
              )}
              {currentStage === 3 && (
                <Stage3Form initialData={data} onNext={handleSaveAndContinue} />
              )}
              {currentStage === 4 && (
                <Stage4Form initialData={data} onNext={handleSaveAndContinue} />
              )}
              {currentStage === 5 && (
                <Stage5Form initialData={data} onNext={handleSaveAndContinue} />
              )}
              {currentStage === 6 && (
                <Stage6Form
                  initialData={data}
                  onNext={handleStage6Submit}
                  onSkip={handleStage6Skip}
                  isSubmitting={isSaving}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Back Button */}
        {currentStage > 1 && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              disabled={isSaving}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
