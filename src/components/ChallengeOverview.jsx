import { getWeeklyDateRanges } from '@/lib/points';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ChallengeOverview() {
  const ranges = getWeeklyDateRanges();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Challenge timeline</CardTitle>
        <CardDescription>
          Baseline week begins April 27, 2026. Scored competition starts May 4, 2026.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ranges.map((range, i) => {
            const isCurrent = today >= range.start && today <= range.end;
            const isPast = today > range.end;
            const isBaseline = i === 0;

            let cardClass = 'rounded-2xl border p-4 ';
            if (isCurrent) cardClass += 'border-primary/40 bg-primary/5';
            else if (isBaseline) cardClass += 'border-amber-200 bg-amber-50';
            else if (isPast) cardClass += 'bg-slate-50 opacity-60';
            else cardClass += 'bg-slate-50';

            return (
              <div key={range.label} className={cardClass}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{range.label}</div>
                  {isCurrent && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Now
                    </span>
                  )}
                  {isBaseline && !isCurrent && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Baseline
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {range.start} – {range.end}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
