import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EditOnboardingFormProps {
  userId: string;
  initialData: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditOnboardingForm({ userId, initialData, onSuccess, onCancel }: EditOnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      // Stage 1
      full_name: initialData?.full_name || '',
      age: initialData?.age || '',
      gender: initialData?.gender || '',
      weight: initialData?.weight || '',

      // Stage 2
      diabetes_type: initialData?.diabetes_type || '',
      years_since_diagnosis: initialData?.years_since_diagnosis || '',
      insulin_usage: initialData?.insulin_usage || false,
      insulin_type: initialData?.insulin_type || '',
      insulin_dosage_range: initialData?.insulin_dosage_range || '',

      // Stage 3
      monitoring_mode: initialData?.monitoring_mode || '',
      cgm_brand: initialData?.cgm_brand || '',
      reading_frequency: initialData?.reading_frequency || '',

      // Stage 4
      diet_type: initialData?.diet_type || '',
      activity_level: initialData?.activity_level || '',
      exercise_frequency: initialData?.exercise_frequency || '',
      skip_meals: initialData?.skip_meals || false,

      // Stage 5
      hypo_frequency: initialData?.hypo_frequency || '',
      alert_preference: initialData?.alert_preference || '',

      // Stage 6
      medical_summary: initialData?.medical_summary || '',
      prescription_summary: initialData?.prescription_summary || '',
    },
  });

  const insulinUsage = watch('insulin_usage');

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      const updateData = {
        full_name: data.full_name || null,
        age: data.age ? parseInt(data.age) : null,
        gender: data.gender || null,
        weight: data.weight ? parseFloat(data.weight) : null,
        diabetes_type: data.diabetes_type || null,
        years_since_diagnosis: data.years_since_diagnosis ? parseInt(data.years_since_diagnosis) : null,
        insulin_usage: data.insulin_usage || false,
        insulin_type: data.insulin_type || null,
        insulin_dosage_range: data.insulin_dosage_range || null,
        monitoring_mode: data.monitoring_mode || null,
        cgm_brand: data.cgm_brand || null,
        reading_frequency: data.reading_frequency || null,
        diet_type: data.diet_type || null,
        activity_level: data.activity_level || null,
        exercise_frequency: data.exercise_frequency || null,
        skip_meals: data.skip_meals || false,
        hypo_frequency: data.hypo_frequency || null,
        alert_preference: data.alert_preference || null,
        medical_summary: data.medical_summary || null,
        prescription_summary: data.prescription_summary || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Profile updated successfully!',
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="diabetes">Diabetes</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" placeholder="Your name" {...register('full_name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" {...register('age')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select defaultValue={initialData?.gender || ''} onValueChange={(value) => setValue('gender', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" step="0.1" {...register('weight')} />
            </div>
          </div>
        </TabsContent>

        {/* Diabetes Tab */}
        <TabsContent value="diabetes" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diabetes_type">Diabetes Type</Label>
            <Select defaultValue={initialData?.diabetes_type || ''} onValueChange={(value) => setValue('diabetes_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Type 1">Type 1</SelectItem>
                <SelectItem value="Type 2">Type 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="years_since_diagnosis">Years Since Diagnosis</Label>
            <Input id="years_since_diagnosis" type="number" {...register('years_since_diagnosis')} />
          </div>

          <Label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={insulinUsage} onCheckedChange={(checked) => setValue('insulin_usage', checked as boolean)} />
            <span>I take insulin</span>
          </Label>

          {insulinUsage && (
            <>
              <div className="space-y-2">
                <Label htmlFor="insulin_type">Insulin Type</Label>
                <Select defaultValue={initialData?.insulin_type || ''} onValueChange={(value) => setValue('insulin_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rapid-acting">Rapid-acting</SelectItem>
                    <SelectItem value="Long-acting">Long-acting</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insulin_dosage_range">Daily Dosage Range</Label>
                <Input id="insulin_dosage_range" placeholder="e.g., 10-20 units" {...register('insulin_dosage_range')} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="monitoring_mode">Monitoring Mode</Label>
            <Select defaultValue={initialData?.monitoring_mode || ''} onValueChange={(value) => setValue('monitoring_mode', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CGM">CGM</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Lifestyle only">Lifestyle only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cgm_brand">CGM Brand (if applicable)</Label>
            <Input id="cgm_brand" placeholder="e.g., Dexcom G6" {...register('cgm_brand')} />
          </div>
        </TabsContent>

        {/* Lifestyle Tab */}
        <TabsContent value="lifestyle" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diet_type">Diet Type</Label>
            <Select defaultValue={initialData?.diet_type || ''} onValueChange={(value) => setValue('diet_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Veg">Vegetarian</SelectItem>
                <SelectItem value="Non-veg">Non-vegetarian</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_level">Activity Level</Label>
            <Select defaultValue={initialData?.activity_level || ''} onValueChange={(value) => setValue('activity_level', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exercise_frequency">Exercise Frequency</Label>
            <Select defaultValue={initialData?.exercise_frequency || ''} onValueChange={(value) => setValue('exercise_frequency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Few times a week">Few times a week</SelectItem>
                <SelectItem value="Rare">Rare</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={watch('skip_meals')} onCheckedChange={(checked) => setValue('skip_meals', checked as boolean)} />
            <span>I often skip meals</span>
          </Label>

          <div className="space-y-2">
            <Label htmlFor="hypo_frequency">Hypo Frequency</Label>
            <Select defaultValue={initialData?.hypo_frequency || ''} onValueChange={(value) => setValue('hypo_frequency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rare">Rare</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Frequent">Frequent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert_preference">Alert Preference</Label>
            <Select defaultValue={initialData?.alert_preference || ''} onValueChange={(value) => setValue('alert_preference', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Early warnings">Early warnings (high sensitivity)</SelectItem>
                <SelectItem value="Balanced">Balanced</SelectItem>
                <SelectItem value="Minimal alerts">Minimal alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medical_summary">Medical Diagnosis Summary</Label>
            <Textarea id="medical_summary" rows={4} {...register('medical_summary')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription_summary">Current Medications</Label>
            <Textarea id="prescription_summary" rows={4} {...register('prescription_summary')} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
