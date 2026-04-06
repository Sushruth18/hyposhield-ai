import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart as LineChartIcon, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/GlassCard';
import { AIInsightsCard } from '@/components/AIInsightsCard';
import { fetchAIInsights, getPredictionHistory, type PredictionRecord } from '@/lib/api';
import type { AIInsights } from '@/types/ai';

export default function Insights() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const readings = useMemo(
    () => predictions
      .filter((prediction) => typeof prediction.input?.glucose === 'number')
      .map((prediction) => ({ value: Number(prediction.input.glucose), timestamp: prediction.createdAt }))
      .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()),
    [predictions]
  );

  useEffect(() => {
    let mounted = true;

    const loadPredictions = async () => {
      setLoadingPredictions(true);
      try {
        const history = await getPredictionHistory(12);
        if (!mounted) return;

        setPredictions(history);
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

  useEffect(() => {
    let active = true;

    const loadInsights = async () => {
      if (readings.length === 0) {
        if (active) {
          setInsights(null);
          setLoadingInsights(false);
        }
        return;
      }

      setLoadingInsights(true);
      setInsightError(null);

      try {
        const response = await fetchAIInsights(readings);
        if (!active) return;

        setInsights(response);
      } catch {
        if (!active) return;

        setInsights(null);
        setInsightError('AI insights temporarily unavailable');
      } finally {
        if (active) {
          setLoadingInsights(false);
        }
      }
    };

    void loadInsights();

    return () => {
      active = false;
    };
  }, [readings]);

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className="pt-20 pb-10 px-4 max-w-5xl mx-auto">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold mb-6">
          <LineChartIcon className="inline h-6 w-6 text-primary mr-2" />Insights
        </motion.h1>

        <div className="space-y-6">
          {loadingPredictions ? (
            <GlassCard>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading predictions...
              </div>
            </GlassCard>
          ) : (
            <AIInsightsCard
              insights={insightError ? null : insights}
              loading={loadingInsights}
              errorMessage={insightError}
            />
          )}

          <GlassCard>
            <h2 className="text-lg font-semibold mb-4">Recent Predictions</h2>
            {predictions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No predictions available yet.</p>
            ) : (
              <div className="space-y-2">
                {predictions.map((prediction) => (
                  <div key={prediction.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{prediction.result.riskLevel} risk</p>
                      <p className="text-xs text-muted-foreground">{new Date(prediction.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {typeof prediction.input.glucose === 'number' ? `${prediction.input.glucose} mg/dL` : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
