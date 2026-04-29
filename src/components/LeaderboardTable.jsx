import { FlaskConical, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getParticipantProfileImage } from '@/lib/participants';
import { CHALLENGE_CONFIG } from '@/lib/config';

const baselineActive = new Date() >= new Date(CHALLENGE_CONFIG.baselineStartDate + 'T00:00:00');
const scoringActive = new Date() >= new Date(CHALLENGE_CONFIG.challengeStartDate + 'T00:00:00');

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
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {!baselineActive && (
            <div className="mb-3 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <FlaskConical className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div className="text-xs text-amber-800">
                <span className="font-semibold text-amber-900">Pre-competition preview</span> — The leaderboard is live early so everyone can verify their setup and shake out any kinks before live scoring starts.
                Keep logging! Scores reset for baseline week on <strong>Apr 27</strong> and begin counting on <strong>May 4</strong>.
              </div>
            </div>
          )}
          {baselineActive && !scoringActive && (
            <div className="mb-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
              <div className="font-bold uppercase tracking-wide">Baseline week: official leaderboard is paused</div>
              <div className="mt-1 leading-6">
                Motivation points may appear in rings and daily previews this week, but they do not count toward the challenge total.
                Official scoring starts May 4.
              </div>
            </div>
          )}
          {rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No leaderboard data yet.
            </div>
          ) : (
            rows.map((row, index) => {
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
              return (
                <div
                  key={`${row.name}-${index}`}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    index === 0 ? 'border-yellow-200 bg-yellow-50' :
                    index === 1 ? 'border-slate-200 bg-slate-50' :
                    index === 2 ? 'border-orange-100 bg-orange-50' : 'bg-white'
                  }`}
                >
                  <div className="w-8 flex-shrink-0 text-center">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>
                  <img
                    src={getParticipantProfileImage(row.profileImage)}
                    alt={row.name}
                    className="h-10 w-10 flex-shrink-0 rounded-full border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">{row.name}</div>
                    {row.teamName && (
                      <div className="truncate text-xs text-muted-foreground">{row.teamName}</div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-bold tabular-nums text-primary">
                      {row.totalPoints ?? row.weeklyTotal ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
