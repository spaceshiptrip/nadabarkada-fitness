import { useMemo, useState } from 'react';
import {
  calculateActiveMinutesImprovementBonus,
  calculateConsistencyBonus,
  calculateDailyPoints,
  calculateStepsImprovementBonus,
  getChallengeWeek,
  getWeeklyDateRanges,
  isActiveDay,
} from '@/lib/points';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getParticipantProfileImage } from '@/lib/participants';

const RING_MOVE = '#FA3E57';
const RING_EXERCISE = '#92E82C';
const RING_STAND = '#1EEAEF';

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

export default function MyRingsPanel({ participants, logs, selectedParticipantName }) {
  const [view, setView] = useState('day');

  const selectedParticipant = useMemo(() => {
    if (!participants.length) return null;
    return participants.find((participant) => participant.name === selectedParticipantName) || participants[0];
  }, [participants, selectedParticipantName]);

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
                : 'Select a participant in Daily Log Entry to view rings.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-[420px] flex-col gap-5">
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

        <div className="grid flex-1 gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-slate-50 p-4">
            <SummaryRings
              pointsProgress={summary.pointsProgress}
              activeProgress={summary.activeProgress}
              stepsProgress={summary.stepsProgress}
            />
            <div className="mt-4 text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {summary.periodLabel}
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-800">{summary.totalPoints} pts</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Points" value={summary.pointsText} color={RING_MOVE} />
              <MetricCard label="Active mins" value={summary.activeText} color={RING_EXERCISE} />
              <MetricCard label="Steps" value={summary.stepsText} color={RING_STAND} />
            </div>

            <div className="space-y-3 rounded-2xl border bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-800">Bonus LEDs</div>
              <div className="flex flex-wrap gap-2">
                <BonusLed active={summary.workoutBonus} colorClass="bg-orange-400" label="Workout" />
                <BonusLed active={summary.mobilityBonus} colorClass="bg-cyan-400" label="Mobility" />
                <BonusLed active={summary.consistencyBonus} colorClass="bg-amber-400" label="Consistency" />
                <BonusLed active={summary.improvementBonus} colorClass="bg-emerald-500" label="Improvement" />
                <BonusLed active={summary.personalBestBonus} colorClass="bg-violet-500" label="Personal best" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function buildSummary(participant, logs, view) {
  const participantLogs = logs.filter((log) => log.name === participant.name);
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const currentWeek = getChallengeWeek(todayIso);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const baselineActive = Number(participant.effectiveBaselineActiveMinutes || participant.baselineActiveMinutes || 0);
  const baselineSteps = Number(participant.effectiveBaselineSteps || participant.baselineSteps || 0);

  if (view === 'day') {
    const log = participantLogs.find((entry) => entry.date === todayIso) || null;
    const points = log ? Number(log.dailyPoints ?? calculateDailyPoints(log)) : 0;
    return {
      periodLabel: formatDateLabel(todayIso),
      totalPoints: points,
      pointsText: `${points} / 10`,
      activeText: `${Number(log?.activeMinutes || 0)} min`,
      stepsText: formatNumber(Number(log?.steps || 0)),
      pointsProgress: points / 10,
      activeProgress: Number(log?.activeMinutes || 0) / 60,
      stepsProgress: Number(log?.steps || 0) / 10000,
      workoutBonus: Boolean(log?.workoutDone),
      mobilityBonus: Boolean(log?.mobilityDone),
      consistencyBonus: false,
      improvementBonus: false,
      personalBestBonus: false,
    };
  }

  if (view === 'week') {
    const weekLogs = participantLogs.filter((entry) => Number(entry.challengeWeek) === currentWeek);
    const standing = getWeeklyStanding(participant, logs, currentWeek);
    const avgActiveMinutes = weekLogs.length
      ? weekLogs.reduce((sum, entry) => sum + Number(entry.activeMinutes || 0), 0) / weekLogs.length
      : 0;
    const avgSteps = weekLogs.length
      ? weekLogs.reduce((sum, entry) => sum + Number(entry.steps || 0), 0) / weekLogs.length
      : 0;

    return {
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
    };
  }

  const monthLogs = participantLogs.filter((entry) => {
    const date = new Date(`${entry.date}T12:00:00`);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const scoredMonthLogs = monthLogs.filter((entry) => Number(entry.challengeWeek) >= 1);
  const monthWeeks = [...new Set(scoredMonthLogs.map((entry) => Number(entry.challengeWeek)))];
  const weeklyStandings = monthWeeks.map((week) => getWeeklyStanding(participant, logs, week));
  const totalMonthPoints = weeklyStandings.reduce((sum, standing) => sum + standing.weeklyTotal, 0);
  const avgActiveMinutes = monthLogs.length
    ? monthLogs.reduce((sum, entry) => sum + Number(entry.activeMinutes || 0), 0) / monthLogs.length
    : 0;
  const avgSteps = monthLogs.length
    ? monthLogs.reduce((sum, entry) => sum + Number(entry.steps || 0), 0) / monthLogs.length
    : 0;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return {
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
  };
}

function buildEmptySummary() {
  return {
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
    consistencyBonus: false,
    improvementBonus: false,
    personalBestBonus: false,
  };
}

function getWeeklyStanding(participant, logs, selectedWeek) {
  const weekLogs = logs.filter((log) => log.name === participant.name && Number(log.challengeWeek) === selectedWeek);

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
  const improvementBonus =
    calculateActiveMinutesImprovementBonus(baselineActive, avgActiveMinutes) +
    calculateStepsImprovementBonus(baselineSteps, avgSteps);

  let priorBest = 0;
  for (let week = 1; week < selectedWeek; week += 1) {
    const priorWeekLogs = logs.filter((log) => log.name === participant.name && Number(log.challengeWeek) === week);
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
    personalBestBonus,
    weeklyTotal: subtotal + personalBestBonus,
  };
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
