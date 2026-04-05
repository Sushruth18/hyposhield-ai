import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Stage2Data {
  diabetes_type: string;
  years_since_diagnosis: number;
  insulin_usage: boolean;
  insulin_type?: string;
  insulin_dosage_range?: string;
  insulin_schedule?: string[];
}

interface Stage2FormProps {
  initialData?: Partial<Stage2Data>;
  onNext: (data: Stage2Data) => void;
}

export function Stage2Form({ initialData, onNext }: Stage2FormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Stage2Data>({
    defaultValues: {
      diabetes_type: initialData?.diabetes_type || '',
      years_since_diagnosis: initialData?.years_since_diagnosis || undefined,
      insulin_usage: initialData?.insulin_usage || false,
      insulin_type: initialData?.insulin_type || '',
      insulin_dosage_range: initialData?.insulin_dosage_range || '',
      insulin_schedule: initialData?.insulin_schedule || [],
    },
  });

  const diabetesType = watch('diabetes_type');
  const insulinUsage = watch('insulin_usage');
  const insulinType = watch('insulin_type');
  const insulinSchedule = watch('insulin_schedule');

  const toggleScheduleItem = (item: string) => {
    const current = insulinSchedule || [];
    if (current.includes(item)) {
      setValue('insulin_schedule', current.filter((i) => i !== item));
    } else {
      setValue('insulin_schedule', [...current, item]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        {/* Diabetes Type */}
        <div className="space-y-2">
          <Label htmlFor="diabetes_type">Diabetes Type *</Label>
          <Select
            value={diabetesType}
            onValueChange={(value) => setValue('diabetes_type', value)}
          >
            <SelectTrigger id="diabetes_type">
              <SelectValue placeholder="Select diabetes type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Type 1">Type 1</SelectItem>
              <SelectItem value="Type 2">Type 2</SelectItem>
            </SelectContent>
          </Select>
          {!diabetesType && <p className="text-sm text-destructive">Diabetes type is required</p>}
        </div>

        {/* Years Since Diagnosis */}
        <div className="space-y-2">
          <Label htmlFor="years_since_diagnosis">Years Since Diagnosis *</Label>
          <Input
            id="years_since_diagnosis"
            type="number"
            placeholder="5"
            {...register('years_since_diagnosis', {
              required: 'Years since diagnosis is required',
              min: { value: 0, message: 'Must be 0 or greater' },
              max: { value: 120, message: 'Please enter a valid number' },
            })}
          />
          {errors.years_since_diagnosis && (
            <p className="text-sm text-destructive">{errors.years_since_diagnosis.message}</p>
          )}
        </div>

        {/* Insulin Usage */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={insulinUsage}
              onCheckedChange={(checked) => setValue('insulin_usage', checked as boolean)}
            />
            <span>Do you take insulin?</span>
          </Label>
        </div>

        {/* Conditional: Insulin Details */}
        {insulinUsage && (
          <>
            {/* Insulin Type */}
            <div className="space-y-2 border-l-2 border-primary pl-4 ml-2">
              <Label htmlFor="insulin_type">Insulin Type *</Label>
              <Select
                value={insulinType}
                onValueChange={(value) => setValue('insulin_type', value)}
              >
                <SelectTrigger id="insulin_type">
                  <SelectValue placeholder="Select insulin type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rapid-acting">Rapid-acting</SelectItem>
                  <SelectItem value="Long-acting">Long-acting</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
              {!insulinType && <p className="text-sm text-destructive">Insulin type is required</p>}
            </div>

            {/* Insulin Dosage Range */}
            <div className="space-y-2 border-l-2 border-primary pl-4 ml-2">
              <Label htmlFor="insulin_dosage_range">Typical Daily Dosage Range (units) *</Label>
              <Input
                id="insulin_dosage_range"
                placeholder="e.g., 10-20 units"
                {...register('insulin_dosage_range', {
                  required: 'Dosage range is required when using insulin',
                })}
              />
              {errors.insulin_dosage_range && (
                <p className="text-sm text-destructive">{errors.insulin_dosage_range.message}</p>
              )}
            </div>

            {/* Injection Times */}
            <div className="space-y-3 border-l-2 border-primary pl-4 ml-2">
              <Label>Usual Injection Times (select all that apply) *</Label>
              <div className="space-y-2">
                {['Morning', 'Afternoon', 'Night'].map((time) => (
                  <Label key={time} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={insulinSchedule?.includes(time) || false}
                      onCheckedChange={() => toggleScheduleItem(time)}
                    />
                    <span className="text-sm">{time}</span>
                  </Label>
                ))}
              </div>
              {(!insulinSchedule || insulinSchedule.length === 0) && (
                <p className="text-sm text-destructive">Select at least one injection time</p>
              )}
            </div>
          </>
        )}
      </div>

      <Button type="submit" className="w-full">
        Continue to Next Step
      </Button>
    </form>
  );
}
