import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/lib/utils';
import { getPredictionHistory, type PredictionRecord } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const riskConfig = {
  LOW: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: CheckCircle },
  MEDIUM: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: AlertCircle },
  HIGH: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', icon: AlertTriangle },
};

export default function History() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getPredictionHistory(30);
        if (mounted) setLogs(data);
      } catch (error) {
        if (mounted) {
          const description = error instanceof Error ? error.message : 'Unable to load history.';
          toast({ title: 'History unavailable', description, variant: 'destructive' });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const formattedLogs = logs.map((entry) => {
    const date = new Date(entry.createdAt);
    return {
      id: entry.id,
      day: date.toLocaleDateString(undefined, { weekday: 'long' }),
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      risk: entry.result.riskLevel,
      explanation: entry.result.explanation,
    };
  });

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className="pt-20 pb-10 px-4 max-w-3xl mx-auto">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold mb-6">
          <Clock className="inline h-6 w-6 text-primary mr-2" />Weekly Risk Log
        </motion.h1>

        <div className="space-y-4">
          {!loading && formattedLogs.length === 0 && (
            <GlassCard>
              <p className="text-sm text-muted-foreground">No prediction history yet. Run a prediction to populate this log.</p>
            </GlassCard>
          )}

          {loading && (
            <GlassCard>
              <p className="text-sm text-muted-foreground">Loading your prediction history...</p>
            </GlassCard>
          )}

          {formattedLogs.map((log, i) => {
            const config = riskConfig[log.risk];
            const Icon = config.icon;
            return (
              <motion.div key={log.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <GlassCard className={cn('border-l-4', config.border)}>
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-xl mt-0.5', config.bg)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{log.day}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{log.date}</span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', config.bg, config.color)}>
                            {log.risk}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.explanation}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
