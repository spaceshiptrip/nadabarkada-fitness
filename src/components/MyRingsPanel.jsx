import { useMemo, useState } from 'react';
import {
  calculateActiveMinutesImprovementBonus,
  calculateConsistencyBonus,
  calculateDailyPoints,
  calculateStepsImprovementBonus,
  getChallengeWeek,
  SCHEDULE,
  getWeeklyDateRanges,
  isActiveDay,
} from '@/lib/points';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getParticipantProfileImage, matchesParticipant } from '@/lib/participants';

const RING_MOVE = '#FA3E57';
const RING_EXERCISE = '#92E82C';
const RING_STAND = '#1EEAEF';
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function SummaryRings({ pointsProgress, activeProgress, stepsProgress, size = 144 }) {
  const cx = size / 2;
  const cy = size / 2;
  const sw = 12;
  const gap = 4;
  const rings = [
    { r: cx - sw / 2, color: RING_MOVE, progress: pointsProgress },
    { r: cx - sw / 2 - sw - gap, color: RING_EXERCISE, progress: activeProgress },
    { r: cx - sw / 2 - (sw + gap) * 2, color: RING_STAND, progress: stepsProgress },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {rings.map(({ r, color, progress }) => {
        const circumference = 2 * Math.PI * r;
        return (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} opacity={0.15} />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={sw}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - Math.min(progress, 1))}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

function BonusLed({ active, colorClass, label }) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs text-slate-600">
      <span
        className={`h-2.5 w-2.5 rounded-full border ${active ? `${colorClass} border-transparent` : 'border-slate-300 bg-white'}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

function DayRings({ log, size = 34 }) {
  const cx = size / 2;
  const cy = size / 2;
  const sw = size < 44 ? 4 : 5;
  const gap = 1;
  const hasData = !!log;
  const points = hasData ? Number(log.dailyPoints ?? calculateDailyPoints(log)) : 0;
  const activeMin = hasData ? Number(log.activeMinutes || 0) : 0;
  const steps = hasData ? Number(log.steps || 0) : 0;

  const rings = [
    { r: cx - sw / 2, color: RING_MOVE, progress: Math.min(points / 10, 1) },
    { r: cx - sw / 2 - sw - gap, color: RING_EXERCISE, progress: Math.min(activeMin / 60, 1) },
    { r: cx - sw / 2 - (sw + gap) * 2, color: RING_STAND, progress: Math.min(steps / 10000, 1) },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {rings.map(({ r, color, progress }) => {
        const circumference = 2 * Math.PI * r;
        return (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} opacity={0.15} />
            {hasData && (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={sw}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function MyRingsPanel({ participants, logs, selectedParticipantId, isAuthenticated }) {
  const [view, setView] = useState('day');
  const [showLegend, setShowLegend] = useState(false);

  const selectedParticipant = useMemo(() => {
    if (!participants.length) return null;
    return participants.find((participant) => participant.id === selectedParticipantId) || null;
  }, [participants, selectedParticipantId]);

  const summary = useMemo(() => {
    if (!selectedParticipant) return buildEmptySummary();
    return buildSummary(selectedParticipant, logs, view);
  }, [selectedParticipant, logs, view]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <img
            src={getParticipantProfileImage(selectedParticipant?.profileImage)}
            alt={selectedParticipant?.name || 'Participant'}
            className="h-12 w-12 rounded-full border object-cover"
          />
          <div>
            <CardTitle>{selectedParticipant?.name || 'My Rings'}</CardTitle>
            <CardDescription>
              {selectedParticipant
                ? `Current ${view} view for ${selectedParticipant.name}.`
                : 'Select your name from the header to view your rings.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {!selectedParticipant && (
        <CardContent>
          <div className="grid gap-4 rounded-2xl border bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">
              Select your name from the header to view your activity rings and weekly progress.
            </p>
          </div>
        </CardContent>
      )}
      {selectedParticipant && !isAuthenticated && (
        <CardContent>
          <div className="grid gap-4 rounded-2xl border bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">
              Enter your PIN in the Daily Log Entry card to unlock your rings.
            </p>
          </div>
        </CardContent>
      )}
      <CardContent className={`flex min-h-[420px] flex-col gap-5 ${!selectedParticipant || !isAuthenticated ? 'hidden' : ''}`}>
        {summary.isPreCompetition && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="font-semibold">Pre-competition updates</div>
            <div className="mt-1">
              Great job and keep it going. These entries help everyone get used to logging, but they do not officially count yet.
            </div>
          </div>
        )}

        <div className="rounded-2xl border bg-slate-50 px-3 py-2 text-[11px] text-slate-600 sm:text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {['day', 'week', 'month'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    view === mode ? 'bg-primary text-primary-foreground' : 'border bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowLegend((current) => !current)}
              className="flex items-center gap-2 text-left"
              aria-expanded={showLegend}
            >
              <span className="font-semibold text-slate-700">Legend</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
                {showLegend ? 'Hide' : 'Show'}
              </span>
            </button>
          </div>

          {showLegend && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RING_MOVE }} /> Points</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RING_EXERCISE }} /> Active mins</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RING_STAND }} /> Steps</span>
              <div className="basis-full h-0 overflow-hidden" aria-hidden="true" />
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Workout bonus (+2)</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Self-Care bonus (+1)</span>
              <div className="basis-full h-0 overflow-hidden" aria-hidden="true" />
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Consistency bonus</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Improvement bonus</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Personal best</span>
            </div>
          )}
        </div>

        {view === 'week' ? (
          <WeekDetail summary={summary} />
        ) : view === 'month' ? (
          <MonthDetail summary={summary} />
        ) : (
          <div className="grid flex-1 gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-slate-50 p-5">
              <SummaryRings
                pointsProgress={summary.pointsProgress}
                activeProgress={summary.activeProgress}
                stepsProgress={summary.stepsProgress}
                size={176}
              />
              <div className="mt-3 flex items-center justify-center gap-2">
                <LedDot active={summary.workoutBonus} colorClass="bg-orange-400" />
                <LedDot active={summary.mobilityBonus} colorClass="bg-cyan-400" />
              </div>
              <div className="mt-4 text-center">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {summary.periodLabel}
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-800">{summary.totalPoints} pts</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3">
                <MetricCard label="Points" value={summary.pointsText} color={RING_MOVE} />
                <MetricCard label="Active mins" value={summary.activeText} color={RING_EXERCISE} />
                <MetricCard label="Steps" value={summary.stepsText} color={RING_STAND} />
              </div>
              {summary.notes && (
                <div className="rounded-2xl border bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Notes
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-700">{summary.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeekDetail({ summary }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full table-fixed bg-white">
          <thead>
            <tr>
              {summary.days.map((day, index) => (
                <th key={day.date} className="px-1 pb-2 pt-3 text-center">
                  <div className="text-[10px] font-semibold text-slate-700 sm:text-xs">{DAY_LABELS[index]}</div>
                  <div className="text-[10px] text-muted-foreground sm:text-xs">{day.shortDate}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              {summary.days.map((day) => (
                <td key={day.date} className="px-1 py-3 text-center align-top">
                  <div className="flex flex-col items-center gap-1">
                    <DayRings log={day.log} size={34} />
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={`h-2.5 w-2.5 rounded-full border ${day.workoutBonus ? 'border-transparent bg-orange-400' : 'border-slate-300 bg-white'}`}
                      />
                      <span
                        className={`h-2.5 w-2.5 rounded-full border ${day.mobilityBonus ? 'border-transparent bg-cyan-400' : 'border-slate-300 bg-white'}`}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold sm:text-xs ${day.points > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                      {day.log ? `${day.points} pt` : '—'}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border bg-slate-50 px-4 py-3">
        <div className="flex items-end justify-between gap-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {summary.periodLabel}
          </div>
          <div className="text-right text-2xl font-bold text-slate-800 sm:text-3xl">
            {summary.totalPoints} pts
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Points" value={summary.pointsText} color={RING_MOVE} />
        <MetricCard label="Active mins" value={summary.activeText} color={RING_EXERCISE} />
        <MetricCard label="Steps" value={summary.stepsText} color={RING_STAND} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <BonusMetricCard
          label="Consistency"
          value={`+${summary.consistencyPoints}`}
          active={summary.consistencyBonus}
          colorClass="bg-amber-400"
          detail={summary.consistencyDetail}
        />
        <BonusMetricCard
          label="Improvement"
          value={`+${summary.improvementPoints}`}
          active={summary.improvementBonus}
          colorClass="bg-emerald-500"
          detail={summary.improvementDetail}
        />
        <BonusMetricCard
          label="Personal best"
          value={`+${summary.personalBestPoints}`}
          active={summary.personalBestBonus}
          colorClass="bg-violet-500"
          detail={summary.personalBestDetail}
        />
      </div>
    </div>
  );
}

function MonthDetail({ summary }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border bg-slate-50 px-4 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {summary.periodLabel}
          </div>
          <div className="mt-1 text-xl font-bold text-slate-800">{summary.totalPoints} pts</div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <BonusLed active={summary.consistencyBonus} colorClass="bg-amber-400" label="Consistency" />
          <BonusLed active={summary.improvementBonus} colorClass="bg-emerald-500" label="Improvement" />
          <BonusLed active={summary.personalBestBonus} colorClass="bg-violet-500" label="Personal best" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Points" value={summary.pointsText} color={RING_MOVE} />
        <MetricCard label="Active mins" value={summary.activeText} color={RING_EXERCISE} />
        <MetricCard label="Steps" value={summary.stepsText} color={RING_STAND} />
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full table-fixed bg-white">
          <thead>
            <tr>
              {DAY_LABELS.map((label) => (
                <th key={label} className="px-1 pb-2 pt-3 text-center text-[10px] font-semibold text-slate-700 sm:text-xs">
                  {label}
                </th>
              ))}
              <th className="w-20 px-1 pb-2 pt-3 text-center text-[10px] font-semibold text-slate-700 sm:text-xs">
                Wk bonus
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.weeks.map((week, index) => (
              <tr key={`month-week-${index}`} className="border-t">
                {week.days.map((day) => (
                  <td key={day.date || day.key} className="px-1 py-3 text-center align-top">
                    {day.date ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-[10px] font-medium text-slate-600 sm:text-xs">{day.dayOfMonth}</div>
                        <DayRings log={day.log} size={30} />
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`h-2 w-2 rounded-full border ${day.workoutBonus ? 'border-transparent bg-orange-400' : 'border-slate-300 bg-white'}`}
                          />
                          <span
                            className={`h-2 w-2 rounded-full border ${day.mobilityBonus ? 'border-transparent bg-cyan-400' : 'border-slate-300 bg-white'}`}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold sm:text-xs ${day.log ? 'text-slate-700' : 'text-slate-300'}`}>
                          {day.log ? `${day.points}` : '—'}
                        </span>
                      </div>
                    ) : (
                      <div className="h-[82px]" />
                    )}
                  </td>
                ))}
                <td className="px-1 py-3 text-center align-top">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={`h-2.5 w-2.5 rounded-full border ${week.consistencyBonus > 0 ? 'border-transparent bg-amber-400' : 'border-slate-300 bg-white'}`}
                      />
                      <span
                        className={`h-2.5 w-2.5 rounded-full border ${week.improvementBonus > 0 ? 'border-transparent bg-emerald-500' : 'border-slate-300 bg-white'}`}
                      />
                      <span
                        className={`h-2.5 w-2.5 rounded-full border ${week.personalBestBonus > 0 ? 'border-transparent bg-violet-500' : 'border-slate-300 bg-white'}`}
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700 sm:text-xs">
                      +{week.bonusPoints}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <div className="mt-2 text-right text-lg font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function BonusMetricCard({ label, value, active, colorClass, detail }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        <span
          className={`h-2.5 w-2.5 rounded-full border ${active ? `${colorClass} border-transparent` : 'border-slate-300 bg-white'}`}
        />
        {label}
      </div>
      <div className="mt-2 text-right text-lg font-semibold text-slate-800">{value}</div>
      <div className="mt-1 text-right text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function LedDot({ active, colorClass }) {
  return (
    <span
      className={`h-3 w-3 rounded-full border ${active ? `${colorClass} border-transparent` : 'border-slate-300 bg-white'}`}
      aria-hidden="true"
    />
  );
}

function buildSummary(participant, logs, view) {
  const participantLogs = logs.filter((log) => matchesParticipant(participant, log));
  const today = new Date();
  const todayIso = toLocalIsoDate(today);
  const currentWeek = getChallengeWeek(todayIso);
  const isPreCompetition = todayIso < SCHEDULE.baselineStart;
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  if (view === 'day') {
    const log = getLogForDate(participantLogs, todayIso);
    const displayDate = todayIso;
    const points = log ? Number(log.dailyPoints ?? calculateDailyPoints(log)) : 0;
    return {
      isPreCompetition,
      periodLabel: formatDateLabel(displayDate),
      totalPoints: points,
      pointsText: `${points} / 10`,
      activeText: `${Number(log?.activeMinutes || 0)} min`,
      stepsText: formatNumber(Number(log?.steps || 0)),
      pointsProgress: points / 10,
      activeProgress: Number(log?.activeMinutes || 0) / 60,
      stepsProgress: Number(log?.steps || 0) / 10000,
      workoutBonus: Boolean(log?.workoutDone),
      mobilityBonus: Boolean(log?.mobilityDone),
      notes: String(log?.notes || '').trim(),
      consistencyBonus: false,
      improvementBonus: false,
      personalBestBonus: false,
    };
  }

  if (view === 'week') {
    if (isPreCompetition) {
      const calendarWeek = getCalendarWeekRange(todayIso);
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(calendarWeek.start, index);
        const log = participantLogs.find((entry) => String(entry.date || '').slice(0, 10) === date) || null;
        return {
          date,
          shortDate: shortDate(date),
          log,
          points: log ? Number(log.dailyPoints ?? calculateDailyPoints(log)) : 0,
          workoutBonus: Boolean(log?.workoutDone),
          mobilityBonus: Boolean(log?.mobilityDone),
        };
      });
      const weekLogs = participantLogs.filter((entry) => isDateInRange(entry.date, calendarWeek.start, calendarWeek.end));
      const totalPoints = weekLogs.reduce((sum, entry) => sum + Number(entry.dailyPoints ?? calculateDailyPoints(entry)), 0);
      const avgActiveMinutes = weekLogs.length
        ? weekLogs.reduce((sum, entry) => sum + Number(entry.activeMinutes || 0), 0) / weekLogs.length
        : 0;
      const avgSteps = weekLogs.length
        ? weekLogs.reduce((sum, entry) => sum + Number(entry.steps || 0), 0) / weekLogs.length
        : 0;

      return {
        isPreCompetition: true,
        periodLabel: 'Pre-competition week',
        totalPoints,
        pointsText: `${totalPoints} pts`,
        activeText: `${Math.round(avgActiveMinutes)} avg`,
        stepsText: `${formatNumber(Math.round(avgSteps))} avg`,
        pointsProgress: totalPoints / 70,
        activeProgress: avgActiveMinutes / 60,
        stepsProgress: avgSteps / 10000,
        workoutBonus: weekLogs.some((entry) => entry.workoutDone),
        mobilityBonus: weekLogs.some((entry) => entry.mobilityDone),
        consistencyBonus: false,
        improvementBonus: false,
        personalBestBonus: false,
        consistencyPoints: 0,
        improvementPoints: 0,
        personalBestPoints: 0,
        consistencyDetail: 'Pre-competition only',
        improvementDetail: 'Pre-competition only',
        personalBestDetail: 'Pre-competition only',
        days,
      };
    }

    const currentWeekRange = getWeeklyDateRanges()[Math.max(currentWeek, 0)];
    const days = currentWeekRange
      ? Array.from({ length: 7 }, (_, index) => {
          const date = addDays(currentWeekRange.start, index);
          const log = participantLogs.find((entry) => String(entry.date || '').slice(0, 10) === date) || null;
          return {
            date,
            shortDate: shortDate(date),
            log,
            points: log ? Number(log.dailyPoints ?? calculateDailyPoints(log)) : 0,
            workoutBonus: Boolean(log?.workoutDone),
            mobilityBonus: Boolean(log?.mobilityDone),
          };
        })
      : [];
    const weekLogs = participantLogs.filter((entry) => Number(entry.challengeWeek) === currentWeek);
    const standing = getWeeklyStanding(participant, logs, currentWeek);
    const activeDays = weekLogs.filter((entry) => isActiveDay(entry)).length;
    const avgActiveMinutes = weekLogs.length
      ? weekLogs.reduce((sum, entry) => sum + Number(entry.activeMinutes || 0), 0) / weekLogs.length
      : 0;
    const avgSteps = weekLogs.length
      ? weekLogs.reduce((sum, entry) => sum + Number(entry.steps || 0), 0) / weekLogs.length
      : 0;

    return {
      isPreCompetition: false,
      periodLabel: getWeeklyLabel(currentWeek),
      totalPoints: standing.weeklyTotal,
      pointsText: `${standing.weeklyTotal} pts`,
      activeText: `${Math.round(avgActiveMinutes)} avg`,
      stepsText: `${formatNumber(Math.round(avgSteps))} avg`,
      pointsProgress: standing.weeklyTotal / 70,
      activeProgress: avgActiveMinutes / 60,
      stepsProgress: avgSteps / 10000,
      workoutBonus: weekLogs.some((entry) => entry.workoutDone),
      mobilityBonus: weekLogs.some((entry) => entry.mobilityDone),
      consistencyBonus: standing.consistencyBonus > 0,
      improvementBonus: standing.improvementBonus > 0,
      personalBestBonus: standing.personalBestBonus > 0,
      consistencyPoints: standing.consistencyBonus,
      improvementPoints: standing.improvementBonus,
      personalBestPoints: standing.personalBestBonus,
      consistencyDetail: buildConsistencyDetail(activeDays, standing.consistencyBonus),
      improvementDetail: buildImprovementDetail(standing),
      personalBestDetail: standing.personalBestBonus > 0 ? 'Beat prior best week' : 'No best-week bonus',
      days,
    };
  }

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthLogs = participantLogs.filter((entry) => String(entry.date || '').startsWith(monthKey));
  const scoredMonthLogs = monthLogs.filter((entry) => Number(entry.challengeWeek) >= 1);
  const monthWeeks = [...new Set(scoredMonthLogs.map((entry) => Number(entry.challengeWeek)))];
  const weeklyStandings = isPreCompetition ? [] : monthWeeks.map((week) => getWeeklyStanding(participant, logs, week));
  const monthCalendarWeeks = buildMonthCalendarWeeks(participantLogs, logs, participant, currentYear, currentMonth);
  const totalMonthPoints = isPreCompetition
    ? monthLogs.reduce((sum, entry) => sum + Number(entry.dailyPoints ?? calculateDailyPoints(entry)), 0)
    : weeklyStandings.reduce((sum, standing) => sum + standing.weeklyTotal, 0);
  const avgActiveMinutes = monthLogs.length
    ? monthLogs.reduce((sum, entry) => sum + Number(entry.activeMinutes || 0), 0) / monthLogs.length
    : 0;
  const avgSteps = monthLogs.length
    ? monthLogs.reduce((sum, entry) => sum + Number(entry.steps || 0), 0) / monthLogs.length
    : 0;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return {
    isPreCompetition,
    periodLabel: today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    totalPoints: totalMonthPoints,
    pointsText: `${totalMonthPoints} pts`,
    activeText: `${Math.round(avgActiveMinutes)} avg`,
    stepsText: `${formatNumber(Math.round(avgSteps))} avg`,
    pointsProgress: totalMonthPoints / (daysInMonth * 10),
    activeProgress: avgActiveMinutes / 60,
    stepsProgress: avgSteps / 10000,
    workoutBonus: monthLogs.some((entry) => entry.workoutDone),
    mobilityBonus: monthLogs.some((entry) => entry.mobilityDone),
    consistencyBonus: weeklyStandings.some((standing) => standing.consistencyBonus > 0),
    improvementBonus: weeklyStandings.some((standing) => standing.improvementBonus > 0),
    personalBestBonus: weeklyStandings.some((standing) => standing.personalBestBonus > 0),
    weeks: monthCalendarWeeks,
  };
}

function buildEmptySummary() {
  return {
    isPreCompetition: false,
    periodLabel: 'No participant selected',
    totalPoints: 0,
    pointsText: '0 / 10',
    activeText: '0 min',
    stepsText: '0',
    pointsProgress: 0,
    activeProgress: 0,
    stepsProgress: 0,
    workoutBonus: false,
    mobilityBonus: false,
    notes: '',
    consistencyBonus: false,
    improvementBonus: false,
    personalBestBonus: false,
    days: [],
    weeks: [],
    consistencyPoints: 0,
    improvementPoints: 0,
    personalBestPoints: 0,
    consistencyDetail: 'No consistency bonus',
    improvementDetail: 'No improvement bonus',
    personalBestDetail: 'No best-week bonus',
  };
}

function getWeeklyStanding(participant, logs, selectedWeek) {
  const weekLogs = logs.filter((log) => matchesParticipant(participant, log) && Number(log.challengeWeek) === selectedWeek);

  if (selectedWeek <= 0) {
    const baselineTotal = weekLogs.reduce((sum, log) => sum + Number(log.dailyPoints ?? calculateDailyPoints(log)), 0);
    return {
      consistencyBonus: 0,
      improvementBonus: 0,
      personalBestBonus: 0,
      weeklyTotal: baselineTotal,
    };
  }

  const dailyPointsTotal = weekLogs.reduce((sum, log) => sum + Number(log.dailyPoints ?? calculateDailyPoints(log)), 0);
  const activeDays = weekLogs.filter((log) => isActiveDay(log)).length;
  const consistencyBonus = calculateConsistencyBonus(activeDays);
  const avgActiveMinutes = weekLogs.length
    ? weekLogs.reduce((sum, log) => sum + Number(log.activeMinutes || 0), 0) / weekLogs.length
    : 0;
  const avgSteps = weekLogs.length
    ? weekLogs.reduce((sum, log) => sum + Number(log.steps || 0), 0) / weekLogs.length
    : 0;
  const baselineActive = Number(participant.effectiveBaselineActiveMinutes || participant.baselineActiveMinutes || 0);
  const baselineSteps = Number(participant.effectiveBaselineSteps || participant.baselineSteps || 0);
  const activeMinutesBonus = calculateActiveMinutesImprovementBonus(baselineActive, avgActiveMinutes);
  const stepsBonus = calculateStepsImprovementBonus(baselineSteps, avgSteps);
  const improvementBonus = activeMinutesBonus + stepsBonus;

  let priorBest = 0;
  for (let week = 1; week < selectedWeek; week += 1) {
    const priorWeekLogs = logs.filter((log) => matchesParticipant(participant, log) && Number(log.challengeWeek) === week);
    if (!priorWeekLogs.length) continue;

    const priorDailyTotal = priorWeekLogs.reduce((sum, log) => sum + Number(log.dailyPoints ?? calculateDailyPoints(log)), 0);
    const priorActiveDays = priorWeekLogs.filter((log) => isActiveDay(log)).length;
    const priorConsistency = calculateConsistencyBonus(priorActiveDays);
    const priorAvgActive = priorWeekLogs.reduce((sum, log) => sum + Number(log.activeMinutes || 0), 0) / priorWeekLogs.length;
    const priorAvgSteps = priorWeekLogs.reduce((sum, log) => sum + Number(log.steps || 0), 0) / priorWeekLogs.length;
    const priorImprovement =
      calculateActiveMinutesImprovementBonus(baselineActive, priorAvgActive) +
      calculateStepsImprovementBonus(baselineSteps, priorAvgSteps);
    const priorSubtotal = priorDailyTotal + priorConsistency + priorImprovement;
    if (priorSubtotal > priorBest) priorBest = priorSubtotal;
  }

  const subtotal = dailyPointsTotal + consistencyBonus + improvementBonus;
  const personalBestBonus = weekLogs.length > 0 && subtotal > priorBest ? 2 : 0;

  return {
    consistencyBonus,
    improvementBonus,
    activeMinutesBonus,
    stepsBonus,
    personalBestBonus,
    weeklyTotal: subtotal + personalBestBonus,
  };
}

function buildConsistencyDetail(activeDays, bonusPoints) {
  if (!bonusPoints) return `${activeDays} active days`;
  return `${activeDays} active days earned it`;
}

function buildImprovementDetail(standing) {
  if (!standing.improvementBonus) return 'No improvement bonus';

  const parts = [];
  if (standing.activeMinutesBonus > 0) parts.push(`active +${standing.activeMinutesBonus}`);
  if (standing.stepsBonus > 0) parts.push(`steps +${standing.stepsBonus}`);

  return parts.join(', ');
}

function formatDateLabel(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function getWeeklyLabel(week) {
  const ranges = getWeeklyDateRanges();
  const range = ranges.find((item, index) => index === week);
  return range ? range.label : 'Current week';
}

function getCalendarWeekRange(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  const mondayOffset = (date.getDay() + 6) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toLocalIsoDate(start),
    end: toLocalIsoDate(end),
  };
}

function isDateInRange(dateStr, start, end) {
  return dateStr >= start && dateStr <= end;
}

function getLogForDate(logs, date) {
  return logs.find((entry) => String(entry.date || '').slice(0, 10) === date) || null;
}

function getLatestLogInRange(logs, start, end) {
  return logs
    .filter((entry) => isDateInRange(String(entry.date || ''), start, end))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null;
}

function addDays(dateStr, amount) {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return toLocalIsoDate(date);
}

function shortDate(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function buildMonthCalendarWeeks(participantLogs, allLogs, participant, year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const firstMondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstMondayOffset);
  const lastSundayOffset = 6 - ((lastOfMonth.getDay() + 6) % 7);
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(lastOfMonth.getDate() + lastSundayOffset);

  const weeks = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    const days = [];
    const weekDates = [];

    for (let index = 0; index < 7; index += 1) {
      const date = toLocalIsoDate(cursor);
      const inMonth = cursor.getMonth() === month;
      if (inMonth) {
        const log = participantLogs.find((entry) => String(entry.date || '').slice(0, 10) === date) || null;
        days.push({
          key: date,
          date,
          dayOfMonth: cursor.getDate(),
          log,
          points: log ? Number(log.dailyPoints ?? calculateDailyPoints(log)) : 0,
          workoutBonus: Boolean(log?.workoutDone),
          mobilityBonus: Boolean(log?.mobilityDone),
        });
      } else {
        days.push({ key: `blank-${date}`, date: '', dayOfMonth: '', log: null, points: 0, workoutBonus: false, mobilityBonus: false });
      }

      weekDates.push(date);
      cursor.setDate(cursor.getDate() + 1);
    }

    const inMonthDates = weekDates.filter((date) => {
      const current = new Date(`${date}T12:00:00`);
      return current.getMonth() === month && current.getFullYear() === year;
    });
    const challengeWeeks = [...new Set(inMonthDates.map((date) => getChallengeWeek(date)).filter((week) => week >= 1))];
    const weekStandings = challengeWeeks.map((week) => getWeeklyStanding(participant, allLogs, week));
    const bonusPoints = weekStandings.reduce(
      (sum, standing) => sum + standing.consistencyBonus + standing.improvementBonus + standing.personalBestBonus,
      0
    );

    weeks.push({
      days,
      consistencyBonus: weekStandings.some((standing) => standing.consistencyBonus > 0),
      improvementBonus: weekStandings.some((standing) => standing.improvementBonus > 0),
      personalBestBonus: weekStandings.some((standing) => standing.personalBestBonus > 0),
      bonusPoints,
    });
  }

  return weeks;
}

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
