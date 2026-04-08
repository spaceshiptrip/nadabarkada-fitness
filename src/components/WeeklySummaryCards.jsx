import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function WeeklySummaryCards({ rows, source }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly summaries</CardTitle>
        <CardDescription>Weekly rollups and bonuses. Source: {source || 'unknown'}.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No weekly summary data yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row, index) => (
              <div key={`${row.name}-${row.week}-${index}`} className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{row.name}</div>
                  <div className="pill">Week {row.week}</div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Daily points</span>
                    <span>{row.dailyPointsTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consistency bonus</span>
                    <span>{row.consistencyBonus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Improvement bonus</span>
                    <span>{row.improvementBonus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best week bonus</span>
                    <span>{row.personalBestBonus}</span>
                  </div>
                </div>
                <div className="mt-4 border-t pt-3 text-right text-lg font-bold text-primary">
                  {row.weeklyTotal} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
