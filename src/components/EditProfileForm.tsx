import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface EditProfileFormValues {
  full_name: string;
  age: string;
  diabetes_type: string;
  diagnosis_date: string;
  hba1c: string;
  insulin_regimen: string;
  last_glucose: string;
  risk_today: string;
}

interface EditProfileFormProps {
  userId: string;
  initialData: {
    full_name: string | null;
    age: number | null;
    diabetes_type: string | null;
    diagnosis_date: string | null;
    hba1c: number | null;
    insulin_regimen: string | null;
    last_glucose: number | null;
    risk_today: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditProfileForm({ userId, initialData, onSuccess, onCancel }: EditProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<EditProfileFormValues>({
    defaultValues: {
      full_name: initialData.full_name || '',
      age: initialData.age || '',
      diabetes_type: initialData.diabetes_type || '',
      diagnosis_date: initialData.diagnosis_date || '',
      hba1c: initialData.hba1c || '',
      insulin_regimen: initialData.insulin_regimen || '',
      last_glucose: initialData.last_glucose || '',
      risk_today: initialData.risk_today || '',
    },
  });

  const riskToday = watch('risk_today');

  const onSubmit = async (data: EditProfileFormValues) => {
    try {
      setIsSubmitting(true);

      const updateData = {
        full_name: data.full_name || null,
        age: data.age ? parseInt(data.age) : null,
        diabetes_type: data.diabetes_type || null,
        diagnosis_date: data.diagnosis_date || null,
        hba1c: data.hba1c ? parseFloat(data.hba1c) : null,
        insulin_regimen: data.insulin_regimen || null,
        last_glucose: data.last_glucose ? parseFloat(data.last_glucose) : null,
        risk_today: data.risk_today || null,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            placeholder="Your full name"
            {...register('full_name')}
          />
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Age"
            {...register('age')}
          />
        </div>

        {/* Diabetes Type */}
        <div className="space-y-2">
          <Label htmlFor="diabetes_type">Diabetes Type</Label>
          <Input
            id="diabetes_type"
            placeholder="e.g., Type 1, Type 2, Gestational"
            {...register('diabetes_type')}
          />
        </div>

        {/* Diagnosis Date */}
        <div className="space-y-2">
          <Label htmlFor="diagnosis_date">Diagnosis Date</Label>
          <Input
            id="diagnosis_date"
            type="date"
            {...register('diagnosis_date')}
          />
        </div>

        {/* Last Glucose */}
        <div className="space-y-2">
          <Label htmlFor="last_glucose">Last Glucose (mg/dL)</Label>
          <Input
            id="last_glucose"
            type="number"
            step="0.1"
            placeholder="e.g., 105"
            {...register('last_glucose')}
          />
        </div>

        {/* HbA1c */}
        <div className="space-y-2">
          <Label htmlFor="hba1c">HbA1c (%)</Label>
          <Input
            id="hba1c"
            type="number"
            step="0.1"
            placeholder="e.g., 7.2"
            {...register('hba1c')}
          />
        </div>

        {/* Insulin Regimen */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="insulin_regimen">Insulin Regimen</Label>
          <Input
            id="insulin_regimen"
            placeholder="e.g., Rapid + Long-acting, MDI, Pump"
            {...register('insulin_regimen')}
          />
        </div>

        {/* Risk Today */}
        <div className="space-y-2">
          <Label htmlFor="risk_today">Risk Today</Label>
          <Select value={riskToday} onValueChange={(value) => setValue('risk_today', value)}>
            <SelectTrigger id="risk_today">
              <SelectValue placeholder="Select risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">LOW</SelectItem>
              <SelectItem value="MEDIUM">MEDIUM</SelectItem>
              <SelectItem value="HIGH">HIGH</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
