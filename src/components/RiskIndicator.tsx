import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type RiskLevel = 'low' | 'moderate' | 'high';

interface RiskIndicatorProps {
  riskLevel?: RiskLevel | null;
}

function getRiskMeta(riskLevel?: RiskLevel | null) {
  if (riskLevel === 'high') {
    return {
      label: 'HIGH',
      tone: 'destructive',
      Icon: ShieldAlert,
      progress: '100%',
    };
  }

  if (riskLevel === 'moderate') {
    return {
      label: 'MODERATE',
      tone: 'warning',
      Icon: AlertTriangle,
      progress: '66%',
    };
  }

  if (riskLevel === 'low') {
    return {
      label: 'LOW',
      tone: 'success',
      Icon: ShieldCheck,
      progress: '33%',
    };
  }

  return null;
}

export function RiskIndicator({ riskLevel }: RiskIndicatorProps) {
  const meta = getRiskMeta(riskLevel);

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hypoglycemia Risk</p>
          <p className="text-sm text-muted-foreground">Current AI risk assessment</p>
        </div>

        {meta ? (
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
              meta.tone === 'destructive'
                ? 'bg-destructive/15 text-destructive'
                : meta.tone === 'warning'
                ? 'bg-warning/15 text-warning'
                : 'bg-success/15 text-success'
            )}
          >
            <meta.Icon className="h-4 w-4" />
            {meta.label}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Risk unavailable
          </span>
        )}
      </div>

      {meta ? (
        <div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                meta.tone === 'destructive'
                  ? 'bg-destructive'
                  : meta.tone === 'warning'
                  ? 'bg-warning'
                  : 'bg-success'
              )}
              style={{ width: meta.progress }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>LOW</span>
            <span>MODERATE</span>
            <span>HIGH</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Risk unavailable</p>
      )}
    </div>
  );
}
