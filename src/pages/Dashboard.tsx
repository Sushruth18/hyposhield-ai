import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, Heart, TrendingDown, Utensils, Syringe, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/GlassCard';
import { predict, type PredictionResult } from '@/lib/risk-engine';
import { getPredictionHistory, type PredictionRecord } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Mock glucose data for 6-hour chart
const glucoseData = Array.from({ length: 24 }, (_, i) => ({
  time: `${Math.floor(i * 15 / 60)}:${String(i * 15 % 60).padStart(2, '0')}`,
  glucose: 95 + Math.sin(i * 0.5) * 25 + (Math.random() - 0.5) * 10,
}));

export default function Dashboard() {
  const { toast } = useToast();
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fallbackResult = useMemo(() => predict('manual', 105, {
    dosage: 6, type: 'rapid-acting', timestamp: new Date(Date.now() - 3600000),
  }, new Date(Date.now() - 7200000), {
    type: 'walking', duration: 20, timestamp: new Date(Date.now() - 5400000),
  }), []);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await Promise.race([
          getPredictionHistory(50),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Prediction history request timed out')), 6000);
          }),
        ]);
        if (mounted) setHistory(data);
      } catch (error) {
        if (mounted) {
          const description = error instanceof Error ? error.message : 'Unable to load prediction history.';
          toast({ title: 'Dashboard data unavailable', description, variant: 'destructive' });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadHistory();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  const realChartData = useMemo(() => {
    return history
      .filter((entry) => {
        const timestamp = new Date(entry.createdAt).getTime();
        return Number.isFinite(timestamp) && timestamp >= sixHoursAgo && typeof entry.input?.glucose === 'number';
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((entry) => {
        const date = new Date(entry.createdAt);
        return {
          time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          glucose: Number(entry.input.glucose),
        };
      });
  }, [history, sixHoursAgo]);

  const hasRealData = realChartData.length > 0;
  const chartData = hasRealData ? realChartData : glucoseData;
  const latestRecord = history[0];
  const result = latestRecord?.result ?? fallbackResult;
  const currentGlucose = latestRecord?.input?.glucose;

  const riskColor = result.riskLevel === 'HIGH' ? 'text-destructive' : result.riskLevel === 'MEDIUM' ? 'text-warning' : 'text-success';
  const riskBg = result.riskLevel === 'HIGH' ? 'bg-destructive/10' : result.riskLevel === 'MEDIUM' ? 'bg-warning/10' : 'bg-success/10';

  const factorData = Object.entries(result.factors).map(([key, value]) => ({
    name: key.replace('_factor', '').replace('_', ' '),
    value,
    fill: value >= 3 ? 'hsl(0 72% 55%)' : value >= 2 ? 'hsl(45 93% 55%)' : 'hsl(175 80% 50%)',
  }));

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold mb-6">
          Dashboard
        </motion.h1>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Heart className={cn("h-5 w-5", riskColor)} />} label="Risk Level" value={result.riskLevel} sub={`Score: ${result.riskScore}/15`} valueClass={riskColor} bgClass={riskBg} />
          <StatCard
            icon={<Activity className="h-5 w-5 text-primary" />}
            label="Current Glucose"
            value={typeof currentGlucose === 'number' ? `${Math.round(currentGlucose)} mg/dL` : 'No reading'}
            sub={latestRecord?.input?.glucoseSource === 'cgm' ? 'CGM reading' : latestRecord ? 'Manual reading' : 'Using fallback'}
            valueClass="text-primary"
            bgClass="bg-primary/10"
          />
          <StatCard
            icon={<Brain className="h-5 w-5 text-primary" />}
            label="Confidence"
            value={`${result.confidence}%`}
            sub={latestRecord?.input?.mode ?? 'Manual mode'}
            valueClass="text-primary"
            bgClass="bg-primary/10"
          />
          <StatCard icon={<TrendingDown className="h-5 w-5 text-warning" />} label="Next 30 min" value={`${Math.round(result.predictions[0].glucose!)} mg/dL`} sub="Predicted" valueClass="text-warning" bgClass="bg-warning/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Glucose Trend */}
          <GlassCard className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Glucose Trend (6 hours)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="glucoseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(175 80% 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(175 80% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
                <XAxis dataKey="time" stroke="hsl(215 15% 55%)" fontSize={12} />
                <YAxis stroke="hsl(215 15% 55%)" fontSize={12} domain={[60, 160]} />
                <Tooltip contentStyle={{ background: 'hsl(220 20% 7%)', border: '1px solid hsl(220 15% 15%)', borderRadius: '12px', color: 'hsl(200 20% 95%)' }} />
                <Area type="monotone" dataKey="glucose" stroke="hsl(175 80% 50%)" fill="url(#glucoseGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            {!loading && !hasRealData && (
              <p className="text-xs text-muted-foreground mt-2">No recent prediction records found. Showing fallback trend data.</p>
            )}
          </GlassCard>

          {/* Risk Breakdown */}
          <GlassCard>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" /> Risk Factors
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={factorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
                <XAxis type="number" domain={[0, 5]} stroke="hsl(215 15% 55%)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(215 15% 55%)" fontSize={11} width={70} />
                <Tooltip contentStyle={{ background: 'hsl(220 20% 7%)', border: '1px solid hsl(220 15% 15%)', borderRadius: '12px', color: 'hsl(200 20% 95%)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {factorData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Prediction Timeline */}
          <GlassCard>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Prediction Timeline
            </h2>
            <div className="space-y-4">
              {result.predictions.map((p) => (
                <div key={p.minutes} className="flex items-center justify-between glass rounded-xl p-4">
                  <div>
                    <span className="text-sm text-muted-foreground">+{p.minutes} min</span>
                    <p className="font-semibold">{Math.round(p.glucose!)} mg/dL</p>
                  </div>
                  <div className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    p.risk >= 9 ? 'bg-destructive/20 text-destructive' : p.risk >= 5 ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                  )}>
                    Risk: {p.risk}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* AI Insights */}
          <GlassCard>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> AI Insights
            </h2>
            <div className="glass rounded-xl p-4 mb-4">
              <p className="text-sm">{result.explanation}</p>
            </div>
            <h3 className="text-sm font-semibold mb-2">Recommended Actions</h3>
            <div className="space-y-2">
              {result.actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{action}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub, valueClass, bgClass }: {
  icon: React.ReactNode; label: string; value: string; sub: string; valueClass: string; bgClass: string;
}) {
  return (
    <GlassCard>
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-xl', bgClass)}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn('text-xl font-bold', valueClass)}>{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
    </GlassCard>
  );
}
