import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const TIME_UNSET = '__none';

function buildTimeOptions(stepMinutes = 30) {
  const options: Array<{ label: string; value: string }> = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const twelveHour = hour % 12 || 12;
      const suffix = hour < 12 ? 'AM' : 'PM';
      const label = `${String(twelveHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
      options.push({ label, value });
    }
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

interface Stage4Data {
  meal_times: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  skip_meals: boolean;
  diet_type: string;
  activity_level: string;
  exercise_frequency: string;
  sleep_start_time: string;
  sleep_end_time: string;
}

interface Stage4FormProps {
  initialData?: Partial<Stage4Data>;
  onNext: (data: Stage4Data) => void;
}

export function Stage4Form({ initialData, onNext }: Stage4FormProps) {
  const mealTimes = initialData?.meal_times ?? {};

  const { handleSubmit, watch, setValue } = useForm<Stage4Data>({
    defaultValues: {
      meal_times: {
        breakfast: mealTimes.breakfast || '',
        lunch: mealTimes.lunch || '',
        dinner: mealTimes.dinner || '',
      },
      skip_meals: initialData?.skip_meals || false,
      diet_type: initialData?.diet_type || '',
      activity_level: initialData?.activity_level || '',
      exercise_frequency: initialData?.exercise_frequency || '',
      sleep_start_time: initialData?.sleep_start_time || '',
      sleep_end_time: initialData?.sleep_end_time || '',
    },
  });

  const skipMeals = watch('skip_meals');
  const dietType = watch('diet_type');
  const activityLevel = watch('activity_level');
  const exerciseFrequency = watch('exercise_frequency');
  const breakfastTime = watch('meal_times.breakfast');
  const lunchTime = watch('meal_times.lunch');
  const dinnerTime = watch('meal_times.dinner');
  const sleepStartTime = watch('sleep_start_time');
  const sleepEndTime = watch('sleep_end_time');

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        {/* Meal Habits */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">🍛 Meal Habits</h3>
          
          <div className="space-y-2">
            <Label htmlFor="breakfast">Breakfast Time (optional)</Label>
            <Select
              value={breakfastTime || TIME_UNSET}
              onValueChange={(value) => setValue('meal_times.breakfast', value === TIME_UNSET ? '' : value)}
            >
              <SelectTrigger id="breakfast">
                <SelectValue placeholder="Select breakfast time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_UNSET}>Not set</SelectItem>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={`breakfast-${option.value}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lunch">Lunch Time (optional)</Label>
            <Select
              value={lunchTime || TIME_UNSET}
              onValueChange={(value) => setValue('meal_times.lunch', value === TIME_UNSET ? '' : value)}
            >
              <SelectTrigger id="lunch">
                <SelectValue placeholder="Select lunch time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_UNSET}>Not set</SelectItem>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={`lunch-${option.value}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dinner">Dinner Time (optional)</Label>
            <Select
              value={dinnerTime || TIME_UNSET}
              onValueChange={(value) => setValue('meal_times.dinner', value === TIME_UNSET ? '' : value)}
            >
              <SelectTrigger id="dinner">
                <SelectValue placeholder="Select dinner time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_UNSET}>Not set</SelectItem>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={`dinner-${option.value}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={skipMeals}
              onCheckedChange={(checked) => setValue('skip_meals', checked as boolean)}
            />
            <span className="text-sm">I often skip meals</span>
          </Label>

          <div className="space-y-2">
            <Label htmlFor="diet_type">Diet Type *</Label>
            <Select value={dietType} onValueChange={(value) => setValue('diet_type', value)}>
              <SelectTrigger id="diet_type">
                <SelectValue placeholder="Select diet type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Veg">Vegetarian</SelectItem>
                <SelectItem value="Non-veg">Non-vegetarian</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activity Profile */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">🏃 Activity Profile</h3>
          
          <div className="space-y-2">
            <Label htmlFor="activity_level">Activity Level *</Label>
            <Select
              value={activityLevel}
              onValueChange={(value) => setValue('activity_level', value)}
            >
              <SelectTrigger id="activity_level">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low (mostly sedentary)</SelectItem>
                <SelectItem value="Moderate">Moderate (light activity)</SelectItem>
                <SelectItem value="High">High (very active)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exercise_frequency">Exercise Frequency *</Label>
            <Select
              value={exerciseFrequency}
              onValueChange={(value) => setValue('exercise_frequency', value)}
            >
              <SelectTrigger id="exercise_frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Few times a week">Few times a week</SelectItem>
                <SelectItem value="Rare">Rare</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sleep Pattern */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">😴 Sleep Pattern</h3>
          
          <div className="space-y-2">
            <Label htmlFor="sleep_start_time">Sleep Time (optional)</Label>
            <Select
              value={sleepStartTime || TIME_UNSET}
              onValueChange={(value) => setValue('sleep_start_time', value === TIME_UNSET ? '' : value)}
            >
              <SelectTrigger id="sleep_start_time">
                <SelectValue placeholder="Select sleep time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_UNSET}>Not set</SelectItem>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={`sleep-start-${option.value}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sleep_end_time">Wake Time (optional)</Label>
            <Select
              value={sleepEndTime || TIME_UNSET}
              onValueChange={(value) => setValue('sleep_end_time', value === TIME_UNSET ? '' : value)}
            >
              <SelectTrigger id="sleep_end_time">
                <SelectValue placeholder="Select wake time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_UNSET}>Not set</SelectItem>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={`sleep-end-${option.value}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue to Next Step
      </Button>
    </form>
  );
}
