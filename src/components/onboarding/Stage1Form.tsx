import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Stage1Data {
  full_name: string;
  age: number;
  gender: string;
  weight: number;
}

interface Stage1FormProps {
  initialData?: Partial<Stage1Data>;
  onNext: (data: Stage1Data) => void;
}

export function Stage1Form({ initialData, onNext }: Stage1FormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Stage1Data>({
    defaultValues: {
      full_name: initialData?.full_name || '',
      age: initialData?.age || undefined,
      gender: initialData?.gender || '',
      weight: initialData?.weight || undefined,
    },
  });

  const gender = watch('gender');

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            placeholder="John Doe"
            {...register('full_name', { required: 'Name is required' })}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age (years) *</Label>
          <Input
            id="age"
            type="number"
            placeholder="42"
            {...register('age', {
              required: 'Age is required',
              min: { value: 1, message: 'Age must be at least 1' },
              max: { value: 130, message: 'Please enter a valid age' },
            })}
          />
          {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender (optional)</Label>
          <Select value={gender} onValueChange={(value) => setValue('gender', value)}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg) *</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder="70"
            {...register('weight', {
              required: 'Weight is required',
              min: { value: 1, message: 'Weight must be at least 1 kg' },
              max: { value: 500, message: 'Please enter a valid weight' },
            })}
          />
          {errors.weight && <p className="text-sm text-destructive">{errors.weight.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue to Next Step
      </Button>
    </form>
  );
}
