import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Stage5Data {
  hypo_frequency: string;
  hypo_timing: string[];
  alert_preference: string;
}

interface Stage5FormProps {
  initialData?: Partial<Stage5Data>;
  onNext: (data: Stage5Data) => void;
}

export function Stage5Form({ initialData, onNext }: Stage5FormProps) {
  const { watch, setValue, handleSubmit } = useForm<Stage5Data>({
    defaultValues: {
      hypo_frequency: initialData?.hypo_frequency || '',
      hypo_timing: initialData?.hypo_timing || [],
      alert_preference: initialData?.alert_preference || '',
    },
  });

  const hypoFrequency = watch('hypo_frequency');
  const hypoTiming = watch('hypo_timing');
  const alertPreference = watch('alert_preference');

  const toggleTiming = (timing: string) => {
    if (hypoTiming.includes(timing)) {
      setValue('hypo_timing', hypoTiming.filter((t) => t !== timing));
    } else {
      setValue('hypo_timing', [...hypoTiming, timing]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        {/* Hypoglycemia History */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">⚠️ Hypoglycemia History</h3>

          <div className="space-y-2">
            <Label htmlFor="hypo_frequency">How often do you experience low blood sugar (hypoglycemia)? *</Label>
            <Select
              value={hypoFrequency}
              onValueChange={(value) => setValue('hypo_frequency', value)}
            >
              <SelectTrigger id="hypo_frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rare">Rare (less than once a month)</SelectItem>
                <SelectItem value="Weekly">Weekly (few times a month)</SelectItem>
                <SelectItem value="Frequent">Frequent (multiple times a week)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>When do hypoglycemic episodes usually occur? (select all that apply)</Label>
            <div className="space-y-2">
              {['Morning', 'Afternoon', 'Evening', 'Night'].map((timing) => (
                <Label key={timing} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={hypoTiming.includes(timing)}
                    onCheckedChange={() => toggleTiming(timing)}
                  />
                  <span className="text-sm">{timing}</span>
                </Label>
              ))}
            </div>
          </div>
        </div>

        {/* Alert Preference */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">🔔 Alert Preference</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Choose how sensitive you want risk alerts to be:
          </p>

          <div className="space-y-2">
            <Label htmlFor="alert_preference">Alert Sensitivity *</Label>
            <Select
              value={alertPreference}
              onValueChange={(value) => setValue('alert_preference', value)}
            >
              <SelectTrigger id="alert_preference">
                <SelectValue placeholder="Select alert preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Early warnings">
                  Early warnings (high sensitivity) - Get alerts at earliest signs
                </SelectItem>
                <SelectItem value="Balanced">
                  Balanced - Standard healthcare thresholds
                </SelectItem>
                <SelectItem value="Minimal alerts">
                  Minimal alerts - Only critical situations
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 p-3 bg-muted rounded text-xs">
            <p className="font-semibold mb-2">Your preference:</p>
            <p className="text-muted-foreground">
              {alertPreference ? (
                `${alertPreference} - Will adjust risk thresholds accordingly`
              ) : (
                'Select a preference to see details'
              )}
            </p>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue to Next Step
      </Button>
    </form>
  );
}
