import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart as LineChartIcon, Clock, Utensils, Syringe, Activity, FileText, Upload, Brain, Loader2, AlertTriangle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/lib/utils';
import { getInsightExplanation, getPredictionHistory, type PredictionRecord } from '@/lib/api';

const criticalInsights = [
  { icon: Clock, title: 'Frequent Risk Window', desc: 'Most hypo events occur between 2-5 AM and 2-4 PM. Consider adjusting pre-bed insulin or having a snack.', severity: 'warning' as const },
  { icon: Utensils, title: 'Meal Irregularity', desc: 'Skipping lunch 3 times this week increased afternoon risk by 40%. Try to maintain regular meal timing.', severity: 'destructive' as const },
  { icon: Syringe, title: 'Insulin Timing', desc: 'Rapid-acting insulin taken <30 min before meals correlates with lower post-meal hypo risk.', severity: 'primary' as const },
  { icon: Activity, title: 'Exercise Impact', desc: 'Evening gym sessions (>45 min) followed by overnight hypo risk. Consider reducing basal insulin on gym days.', severity: 'warning' as const },
];

export default function Insights() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [explanation, setExplanation] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPredictions = async () => {
      setLoadingPredictions(true);
      try {
        const history = await getPredictionHistory(12);
        if (!mounted) return;

        setPredictions(history);
        setSelectedPredictionId(history[0]?.id ?? null);
        if (history.length === 0) {
          setInsightError('No predictions found. Run a prediction first to generate AI insights.');
        }
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Failed to load prediction history.';
        setInsightError(message);
      } finally {
        if (mounted) {
          setLoadingPredictions(false);
        }
      }
    };

    void loadPredictions();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedPrediction = useMemo(
    () => predictions.find((record) => record.id === selectedPredictionId) ?? null,
    [predictions, selectedPredictionId]
  );

  const generateExplanation = useCallback(async (prediction: PredictionRecord) => {
    const factors = prediction.result.factors;
    const glucose = prediction.input.glucose;

    setIsGenerating(true);
    setInsightError(null);

    try {
      const text = await getInsightExplanation({
        glucose,
        riskScore: prediction.result.riskScore,
        riskLevel: prediction.result.riskLevel,
        confidence: prediction.result.confidence,
        factors: {
          glucose_factor: Number(factors.glucose_factor ?? 0),
          trend_factor: Number(factors.trend_factor ?? 0),
          activity_factor: Number(factors.activity_factor ?? 0),
          meal_gap_factor: Number(factors.meal_gap_factor ?? 0),
          insulin_factor: Number(factors.insulin_factor ?? 0),
          time_factor: Number(factors.time_factor ?? 0),
        },
      });

      setExplanation(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate explanation.';
      setExplanation('');
      setInsightError(message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleRegenerateExplanation = async () => {
    if (!selectedPrediction || isGenerating) return;
    await generateExplanation(selectedPrediction);
  };

  useEffect(() => {
    if (!selectedPrediction) return;
    void generateExplanation(selectedPrediction);
  }, [generateExplanation, selectedPrediction]);

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className="pt-20 pb-10 px-4 max-w-5xl mx-auto">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold mb-6">
          <LineChartIcon className="inline h-6 w-6 text-primary mr-2" />Insights
        </motion.h1>

        <GlassCard className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Prediction-Linked AI Explanation</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Select a prediction to generate explanation using: glucose, trend, activity, meal gap factors.</p>
              {loadingPredictions ? (
                <div className="glass rounded-xl p-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading predictions...
                </div>
              ) : predictions.length === 0 ? (
                <div className="glass rounded-xl p-4 text-sm text-muted-foreground">No predictions available yet.</div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {predictions.map((prediction) => {
                    const selected = prediction.id === selectedPredictionId;
                    return (
                      <button
                        key={prediction.id}
                        type="button"
                        onClick={() => setSelectedPredictionId(prediction.id)}
                        className={cn(
                          'w-full text-left glass rounded-xl p-3 border transition-colors',
                          selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        )}
                      >
                        <p className="text-sm font-semibold">{prediction.result.riskLevel} risk • Score {prediction.result.riskScore.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(prediction.createdAt).toLocaleString()} • Glucose {typeof prediction.input.glucose === 'number' ? `${prediction.input.glucose} mg/dL` : 'N/A'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="glass rounded-xl p-4 min-h-[180px] border border-border">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold">Backend Explanation</h3>
                  <button
                    type="button"
                    onClick={() => void handleRegenerateExplanation()}
                    disabled={!selectedPrediction || isGenerating}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors',
                      !selectedPrediction || isGenerating
                        ? 'cursor-not-allowed opacity-60'
                        : 'hover:bg-primary/10 hover:border-primary/50'
                    )}
                  >
                    {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {isGenerating ? 'Regenerating...' : 'Regenerate explanation'}
                  </button>
                </div>

                {isGenerating && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating explanation...
                  </div>
                )}

                {!isGenerating && insightError && (
                  <div className="flex items-start gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{insightError}</span>
                  </div>
                )}

                {!isGenerating && !insightError && explanation && (
                  <p className="text-sm leading-relaxed text-foreground">{explanation}</p>
                )}

                {!isGenerating && !insightError && !explanation && (
                  <p className="text-sm text-muted-foreground">Select a prediction to generate an explanation.</p>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {criticalInsights.map((insight, i) => (
            <motion.div key={insight.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GlassCard className="h-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${insight.severity === 'destructive' ? 'bg-destructive/10' : insight.severity === 'warning' ? 'bg-warning/10' : 'bg-primary/10'}`}>
                    <insight.icon className={`h-5 w-5 ${insight.severity === 'destructive' ? 'text-destructive' : insight.severity === 'warning' ? 'text-warning' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground">{insight.desc}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Document AI Analysis */}
        <GlassCard>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Document AI Analysis
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a diagnosis or prescription document and our AI will extract key findings, risk indicators, and simplified explanations.
          </p>
          <div className="glass rounded-xl p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-border">
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">Drop your document here</p>
            <p className="text-xs text-muted-foreground">PDF, JPG, or PNG — max 10MB</p>
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" /> Powered by AI for medical document understanding
            </p>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
