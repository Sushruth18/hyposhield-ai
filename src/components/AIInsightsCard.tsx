import { useEffect, useMemo, useState } from 'react';
import { Brain, Loader2, Shield } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { getAIInsights, type PredictionRecord } from '@/lib/api';
import type { AIInsights } from '@/types/ai';
import { RiskIndicator } from '@/components/RiskIndicator';

type InsightReading = {
  value: number;
  timestamp: string;
};

interface AIInsightsCardProps {
  predictions?: PredictionRecord[];
  insights?: AIInsights | null;
  loading?: boolean;
  errorMessage?: string | null;
}

export function AIInsightsCard({ predictions = [], insights: controlledInsights, loading: controlledLoading, errorMessage }: AIInsightsCardProps) {
  const readings = useMemo<InsightReading[]>(() => {
    return predictions
      .filter((prediction) => typeof prediction.input?.glucose === 'number')
      .map((prediction) => ({
        value: Number(prediction.input.glucose),
        timestamp: prediction.createdAt,
      }))
      .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
  }, [predictions]);

  const [internalInsights, setInternalInsights] = useState<AIInsights | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalFailed, setInternalFailed] = useState(false);

  const isControlled = controlledInsights !== undefined || controlledLoading !== undefined || errorMessage !== undefined;
  const insights = isControlled ? controlledInsights ?? null : internalInsights;
  const loading = isControlled ? Boolean(controlledLoading) : internalLoading;
  const failed = isControlled ? Boolean(errorMessage) : internalFailed;

  useEffect(() => {
    let active = true;

    const loadInsights = async () => {
      if (readings.length === 0) {
        if (!active) {
          return;
        }

        setInternalInsights(null);
        setInternalFailed(false);
        setInternalLoading(false);
        return;
      }

      setInternalLoading(true);
      setInternalFailed(false);

      try {
        const response = await getAIInsights({ readings });

        if (!active) {
          return;
        }

        setInternalInsights(response);
      } catch {
        if (!active) {
          return;
        }

        setInternalInsights(null);
        setInternalFailed(true);
      } finally {
        if (active) {
          setInternalLoading(false);
        }
      }
    };

    void loadInsights();

    return () => {
      active = false;
    };
  }, [readings]);

  return (
    <GlassCard className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> AI Insights
          </h2>
          <p className="text-sm text-muted-foreground">Structured hypoglycemia risk analysis from recent glucose data.</p>
        </div>
      </div>

      <RiskIndicator riskLevel={insights?.riskLevel?.toLowerCase() as 'low' | 'moderate' | 'high' | undefined} />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating AI insights...
        </div>
      )}

      {!loading && failed && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          AI insights temporarily unavailable
        </div>
      )}

      {!loading && !failed && !insights && readings.length === 0 && (
        <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
          No recent glucose data yet.
        </div>
      )}

      {!loading && !failed && insights && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">AI Explanation</p>
            <p className="text-sm leading-relaxed text-foreground">{insights.insights}</p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Recommendations</p>
            <p className="text-sm leading-relaxed text-foreground">{insights.recommendations}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
