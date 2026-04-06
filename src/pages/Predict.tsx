import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Syringe, Utensils, Activity as ActivityIcon, Droplets, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDIAN_MEALS, EXERCISE_TYPES, type PredictionResult, type PredictionMode } from '@/lib/risk-engine';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { createPrediction } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Predict() {
  const [glucose, setGlucose] = useState('');
  const [glucoseSource, setGlucoseSource] = useState<'cgm' | 'glucometer'>('glucometer');
  const [insulinDosage, setInsulinDosage] = useState('');
  const [insulinType, setInsulinType] = useState<'rapid-acting' | 'long-acting'>('rapid-acting');
  const [insulinHoursAgo, setInsulinHoursAgo] = useState('1');
  const [selectedMeal, setSelectedMeal] = useState('');
  const [mealHoursAgo, setMealHoursAgo] = useState('2');
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  type SelectValue = 'glucometer' | 'cgm' | 'rapid-acting' | 'long-acting';

  const handlePredict = async () => {
    const mode: PredictionMode = glucoseSource === 'cgm' ? 'cgm' : glucose ? 'manual' : 'lifestyle';

    const parsedGlucose = glucose ? parseFloat(glucose) : undefined;
    if (glucose && (parsedGlucose === undefined || Number.isNaN(parsedGlucose))) {
      toast({ title: 'Invalid glucose value', description: 'Enter a valid glucose reading.', variant: 'destructive' });
      return;
    }

    const insulinLog = insulinDosage ? {
      dosage: parseFloat(insulinDosage),
      type: insulinType,
      hoursAgo: parseFloat(insulinHoursAgo),
    } : undefined;

    if (insulinLog && (Number.isNaN(insulinLog.dosage) || Number.isNaN(insulinLog.hoursAgo))) {
      toast({ title: 'Invalid insulin input', description: 'Check dosage and hours ago values.', variant: 'destructive' });
      return;
    }

    const parsedMealHours = mealHoursAgo ? parseFloat(mealHoursAgo) : undefined;
    if (mealHoursAgo && (parsedMealHours === undefined || Number.isNaN(parsedMealHours))) {
      toast({ title: 'Invalid meal timing', description: 'Enter a valid number of hours since meal.', variant: 'destructive' });
      return;
    }

    const activityLog = exerciseType && exerciseDuration ? {
      type: exerciseType.toLowerCase(),
      duration: parseInt(exerciseDuration),
      hoursAgo: 1,
    } : undefined;

    if (activityLog && Number.isNaN(activityLog.duration)) {
      toast({ title: 'Invalid activity duration', description: 'Enter duration in minutes.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const record = await createPrediction({
        mode,
        glucose: parsedGlucose,
        glucoseSource,
        insulin: insulinLog,
        mealHoursAgo: parsedMealHours,
        activity: activityLog,
      });
      setResult(record.result);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Unable to run prediction right now.';
      toast({ title: 'Prediction failed', description, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const meal = INDIAN_MEALS.find(m => m.name === selectedMeal);

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className="pt-20 pb-10 px-4 max-w-5xl mx-auto">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold mb-6">
          <Brain className="inline h-6 w-6 text-primary mr-2" />Prediction Engine
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            {/* Glucose */}
            <GlassCard>
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Droplets className="h-4 w-4 text-primary" /> Glucose Reading</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="mg/dL" value={glucose} onChange={e => setGlucose(e.target.value)} className="bg-secondary border-border rounded-xl" />
                <Select value={glucoseSource} onValueChange={(v) => setGlucoseSource(v as SelectValue)}>
                  <SelectTrigger className="bg-secondary border-border rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glucometer">Glucometer</SelectItem>
                    <SelectItem value="cgm">CGM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Measured using glucometer or CGM device</p>
            </GlassCard>

            {/* Insulin */}
            <GlassCard>
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Syringe className="h-4 w-4 text-primary" /> Insulin Dosage</h3>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="Units" value={insulinDosage} onChange={e => setInsulinDosage(e.target.value)} className="bg-secondary border-border rounded-xl" />
                <Select value={insulinType} onValueChange={(v) => setInsulinType(v as SelectValue)}>
                  <SelectTrigger className="bg-secondary border-border rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rapid-acting">Rapid-acting</SelectItem>
                    <SelectItem value="long-acting">Long-acting</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Hours ago" value={insulinHoursAgo} onChange={e => setInsulinHoursAgo(e.target.value)} className="bg-secondary border-border rounded-xl" />
              </div>
            </GlassCard>

            {/* Meal */}
            <GlassCard>
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Utensils className="h-4 w-4 text-primary" /> Meal</h3>
              <div className="grid grid-cols-2 gap-3">
                <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                  <SelectTrigger className="bg-secondary border-border rounded-xl"><SelectValue placeholder="Select meal" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_MEALS.map(m => (
                      <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Hours ago" value={mealHoursAgo} onChange={e => setMealHoursAgo(e.target.value)} className="bg-secondary border-border rounded-xl" />
              </div>
              {meal && (
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span>Calories: {meal.calories}</span>
                  <span>Carbs: {meal.carbs}g</span>
                </div>
              )}
            </GlassCard>

            {/* Exercise */}
            <GlassCard>
              <h3 className="font-semibold flex items-center gap-2 mb-3"><ActivityIcon className="h-4 w-4 text-primary" /> Exercise</h3>
              <div className="grid grid-cols-2 gap-3">
                <Select value={exerciseType} onValueChange={setExerciseType}>
                  <SelectTrigger className="bg-secondary border-border rounded-xl"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Duration (min)" value={exerciseDuration} onChange={e => setExerciseDuration(e.target.value)} className="bg-secondary border-border rounded-xl" />
              </div>
            </GlassCard>

            <Button onClick={handlePredict} disabled={submitting} className="w-full gradient-primary text-primary-foreground font-semibold rounded-xl" size="lg">
              {submitting ? 'Running...' : 'Run Prediction'} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {result ? (
              <>
                <GlassCard glow={result.riskLevel === 'HIGH'}>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
                    <p className={cn('text-4xl font-bold', result.riskLevel === 'HIGH' ? 'text-destructive' : result.riskLevel === 'MEDIUM' ? 'text-warning' : 'text-success')}>
                      {result.riskLevel}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Score: {result.riskScore}/15 · Confidence: {result.confidence}%</p>
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-semibold mb-3">Prediction Timeline</h3>
                  {result.predictions.map(p => (
                    <div key={p.minutes} className="flex justify-between items-center glass rounded-xl p-3 mb-2">
                      <span className="text-sm">+{p.minutes} min</span>
                      <span className="font-semibold">{Math.round(p.glucose!)} mg/dL</span>
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                        p.risk >= 9 ? 'bg-destructive/20 text-destructive' : p.risk >= 5 ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                      )}>Risk {p.risk}</span>
                    </div>
                  ))}
                </GlassCard>

                <GlassCard>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Risk Breakdown</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={Object.entries(result.factors).map(([k, v]) => ({
                      name: k.replace('_factor', ''),
                      value: v,
                      fill: v >= 3 ? 'hsl(0 72% 55%)' : v >= 2 ? 'hsl(45 93% 55%)' : 'hsl(175 80% 50%)',
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
                      <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={10} />
                      <YAxis domain={[0, 5]} stroke="hsl(215 15% 55%)" fontSize={10} />
                      <Tooltip contentStyle={{ background: 'hsl(220 20% 7%)', border: '1px solid hsl(220 15% 15%)', borderRadius: '12px', color: 'hsl(200 20% 95%)' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {Object.entries(result.factors).map(([k, v], i) => (
                          <Cell key={i} fill={v >= 3 ? 'hsl(0 72% 55%)' : v >= 2 ? 'hsl(45 93% 55%)' : 'hsl(175 80% 50%)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-semibold mb-2">AI Explanation</h3>
                  <p className="text-sm text-muted-foreground mb-4">{result.explanation}</p>
                  <h4 className="text-sm font-semibold mb-2">Recommended Actions</h4>
                  {result.actions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm mb-1">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{a}</span>
                    </div>
                  ))}
                </GlassCard>
              </>
            ) : (
              <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">Enter your data</h3>
                <p className="text-sm text-muted-foreground">Fill in the fields and run a prediction to see your risk analysis.</p>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
