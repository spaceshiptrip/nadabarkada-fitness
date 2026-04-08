import { getWeeklyDateRanges } from '@/lib/points';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ChallengeOverview() {
  const ranges = getWeeklyDateRanges();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Challenge timeline</CardTitle>
        <CardDescription>
          Baseline week begins April 27, 2026. Scored competition starts May 4, 2026.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ranges.map((range) => (
            <div key={range.label} className="rounded-2xl border bg-slate-50 p-4">
              <div className="font-semibold">{range.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {range.start} → {range.end}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
