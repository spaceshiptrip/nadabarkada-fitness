import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function LeaderboardTable({
  rows,
  source,
  title = 'Leaderboard',
  description = 'Ranked by total challenge points.',
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description} Source: {source || 'unknown'}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Baseline active</TableHead>
              <TableHead>Baseline steps</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No leaderboard data yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${row.name}-${index}`}>
                  <TableCell className="font-semibold">#{index + 1}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.deviceType || '—'}</TableCell>
                  <TableCell>{row.teamName || '—'}</TableCell>
                  <TableCell>{row.baselineActiveMinutes ?? '—'}</TableCell>
                  <TableCell>{row.baselineSteps ?? '—'}</TableCell>
                  <TableCell className="text-right font-semibold">{row.totalPoints ?? row.weeklyTotal ?? 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
