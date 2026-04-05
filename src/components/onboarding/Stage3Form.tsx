import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Stage3Data {
  monitoring_mode: string;
  cgm_brand?: string;
  reading_frequency?: string;
}

interface Stage3FormProps {
  initialData?: Partial<Stage3Data>;
  onNext: (data: Stage3Data) => void;
}

export function Stage3Form({ initialData, onNext }: Stage3FormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Stage3Data>({
    defaultValues: {
      monitoring_mode: initialData?.monitoring_mode || '',
      cgm_brand: initialData?.cgm_brand || '',
      reading_frequency: initialData?.reading_frequency || '',
    },
  });

  const monitoringMode = watch('monitoring_mode');
  const readingFrequency = watch('reading_frequency');

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        {/* Monitoring Mode */}
        <div className="space-y-2">
          <Label htmlFor="monitoring_mode">How do you monitor your glucose? *</Label>
          <Select
            value={monitoringMode}
            onValueChange={(value) => setValue('monitoring_mode', value)}
          >
            <SelectTrigger id="monitoring_mode">
              <SelectValue placeholder="Select monitoring method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CGM">CGM (Continuous Glucose Monitor)</SelectItem>
              <SelectItem value="Manual">Manual (Glucometer)</SelectItem>
              <SelectItem value="Lifestyle only">Lifestyle only</SelectItem>
            </SelectContent>
          </Select>
          {!monitoringMode && <p className="text-sm text-destructive">Monitoring mode is required</p>}
        </div>

        {/* Conditional: CGM Details */}
        {monitoringMode === 'CGM' && (
          <div className="space-y-3 border-l-2 border-primary pl-4 ml-2">
            <div className="space-y-2">
              <Label htmlFor="cgm_brand">CGM Brand (optional)</Label>
              <Input
                id="cgm_brand"
                placeholder="e.g., Freestyle Libre, Dexcom G6"
                {...register('cgm_brand')}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We support Dexcom and Freestyle Libre sync integration
            </p>
          </div>
        )}

        {/* Conditional: Manual Readings */}
        {monitoringMode === 'Manual' && (
          <div className="space-y-3 border-l-2 border-primary pl-4 ml-2">
            <Label htmlFor="reading_frequency">Readings per day *</Label>
            <Select
              value={readingFrequency}
              onValueChange={(value) => setValue('reading_frequency', value)}
            >
              <SelectTrigger id="reading_frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-2">1-2 readings</SelectItem>
                <SelectItem value="3-4">3-4 readings</SelectItem>
                <SelectItem value="5+">5+ readings</SelectItem>
              </SelectContent>
            </Select>
            {!readingFrequency && (
              <p className="text-sm text-destructive">Reading frequency is required</p>
            )}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full">
        Continue to Next Step
      </Button>
    </form>
  );
}
