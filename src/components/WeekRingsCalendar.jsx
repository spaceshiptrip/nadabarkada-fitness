import { useState } from 'react';
import {
  calculateActiveMinutesImprovementBonus,
  calculateConsistencyBonus,
  calculateDailyPoints,
  calculateStepsImprovementBonus,
  getWeeklyDateRanges,
  isActiveDay,
} from '@/lib/points';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getParticipantProfileImage } from '@/lib/participants';

// Apple Watch ring colors
const RING_MOVE     = '#FA3E57'; // red   — daily points (main ring)
const RING_EXERCISE = '#92E82C'; // green — active minutes
const RING_STAND    = '#1EEAEF'; // cyan  — steps

function ActivityRings({ log, size = 34 }) {
  const cx = size / 2;
  const cy = size / 2;
  const sw = size < 44 ? 4 : 5;
  const gap = 1;

  const hasData = !!log;
  const points       = hasData ? (log.dailyPoints ?? calculateDailyPoints(log)) : 0;
  const activeMin    = hasData ? (log.activeMinutes || 0) : 0;
  const steps        = hasData ? (log.steps || 0) : 0;

  const rings = [
    { r: cx - sw / 2,               color: RING_MOVE,     progress: Math.min(points / 10, 1) },
    { r: cx - sw / 2 - sw - gap,    color: RING_EXERCISE, progress: Math.min(activeMin / 60, 1) },
    { r: cx - sw / 2 - (sw + gap) * 2, color: RING_STAND, progress: Math.min(steps / 10000, 1) },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)' }}
    >
      {rings.map(({ r, color, progress }) => {
        const circ = 2 * Math.PI * r;
        return (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} opacity={0.15} />
            {hasData && (
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={color}
                strokeWidth={sw}
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - progress)}
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function shortDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getPointsValue(log) {
  return Number(log?.dailyPoints ?? calculateDailyPoints(log) ?? 0);
}

export default function WeekRingsCalendar({
  logs,
  participants,
  title = 'Weekly Leaderboard Rings',
  description = 'Selected week ranked by points, with daily rings for each participant.',
}) {
  const weeks = getWeeklyDateRanges();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [showLegend, setShowLegend] = useState(false);

  const week = weeks[selectedWeek];
  const days = Array.from({ length: 7 }, (_, i) => addDays(week.start, i));

  const visibleParticipants = participants.length > 0
    ? participants
    : [...new Set(logs.map((l) => l.name))].map((name) => ({ name, profileImage: '' }));

  const rankedParticipants = visibleParticipants
    .map((participant) => {
      const standing = getWeeklyStanding(participant, logs, selectedWeek);
      return {
        ...participant,
        ...standing,
      };
    })
    .sort((a, b) => {
      if (b.weeklyTotal !== a.weeklyTotal) return b.weeklyTotal - a.weeklyTotal;
      return a.name.localeCompare(b.name);
    });
  const topParticipant = rankedParticipants[0] || null;
  const weekEnded = new Date(`${week.end}T23:59:59`) < new Date();

  function getLog(name, date) {
    return logs.find((l) => l.name === name && l.date === date) || null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}{' '}
        </CardDescription>
        {topParticipant && (
          <div className="mt-2 rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-semibold">{weekEnded ? 'Week winner:' : 'Currently leading:'}</span>{' '}
            {topParticipant.name} with {topParticipant.weeklyTotal} pts
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Week tabs */}
        <div className="mb-4 flex flex-wrap gap-1">
          {weeks.map((w, i) => (
            <button
              key={w.label}
              onClick={() => setSelectedWeek(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedWeek === i
                  ? 'bg-primary text-primary-foreground'
                  : 'border bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {w.label.replace('Week ', 'W').replace('(Baseline)', '0')}
            </button>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border bg-slate-50 px-3 py-2 text-[11px] text-slate-600 sm:text-xs">
          <button
            type="button"
            onClick={() => setShowLegend((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={showLegend}
          >
            <span className="font-semibold text-slate-700">Legend</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
              {showLegend ? 'Hide' : 'Show'}
            </span>
          </button>

          {showLegend && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RING_MOVE }} /> Points</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RING_EXERCISE }} /> Active mins</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RING_STAND }} /> Steps</span>
              <div className="basis-full h-0 overflow-hidden" aria-hidden="true" />
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Workout bonus</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Self-Care bonus</span>
              <div className="basis-full h-0 overflow-hidden" aria-hidden="true" />
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Consistency bonus</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Improvement bonus</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Personal best</span>
            </div>
          )}
        </div>

        {/* Calendar grid */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                <th className="w-24 pb-2 text-left text-[10px] font-medium text-muted-foreground sm:w-28 sm:text-xs" />
                {days.map((date, i) => (
                  <th key={date} className="pb-2 text-center">
                    <div className="text-[10px] font-semibold text-slate-700 sm:text-xs">{DAY_LABELS[i]}</div>
                    <div className="text-[10px] text-muted-foreground sm:text-xs">{shortDate(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankedParticipants.map((participant, index) => (
                <tr key={participant.name} className="border-t">
                  <td className="py-2 pr-1 align-top sm:py-3 sm:pr-2">
                    <div className="flex flex-col items-center gap-1.5">
                      <img
                        src={getParticipantProfileImage(participant.profileImage)}
                        alt={participant.name}
                        className="h-8 w-8 rounded-full border object-cover sm:h-10 sm:w-10"
                      />
                      <div className="text-center leading-tight">
                        <div className="text-[10px] font-semibold text-slate-700 sm:text-xs">
                          #{index + 1} {participant.name}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-primary sm:text-xs">
                          {participant.weeklyTotal} pts
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <BonusLed active={participant.consistencyBonus > 0} colorClass="bg-amber-400" />
                          <BonusLed active={participant.improvementBonus > 0} colorClass="bg-emerald-500" />
                          <BonusLed active={participant.personalBestBonus > 0} colorClass="bg-violet-500" />
                        </div>
                      </div>
                    </div>
                  </td>
                  {days.map((date) => {
                    const log = getLog(participant.name, date);
                    const pts = log ? (log.dailyPoints ?? calculateDailyPoints(log)) : null;
                    return (
                      <td key={date} className="py-2 text-center sm:py-3">
                        <div className="flex flex-col items-center gap-1">
                          <ActivityRings log={log} size={34} />
                          <div className="flex items-center justify-center gap-1">
                            <BonusLed active={Boolean(log?.workoutDone)} colorClass="bg-orange-400" />
                            <BonusLed active={Boolean(log?.mobilityDone)} colorClass="bg-cyan-400" />
                          </div>
                          <span className={`text-[10px] tabular-nums font-semibold sm:text-xs ${pts !== null ? 'text-slate-700' : 'text-slate-300'}`}>
                            {pts !== null ? `${pts} pt` : '—'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function BonusLed({ active, colorClass }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full border ${active ? colorClass + ' border-transparent' : 'border-slate-300 bg-white'}`}
      aria-hidden="true"
    />
  );
}

function getWeeklyStanding(participant, logs, selectedWeek) {
  const weekLogs = logs.filter(
    (log) => log.name === participant.name && Number(log.challengeWeek) === selectedWeek
  );

  if (selectedWeek === 0) {
    const baselineTotal = weekLogs.reduce((sum, log) => sum + getPointsValue(log), 0);

    return {
      consistencyBonus: 0,
      improvementBonus: 0,
      personalBestBonus: 0,
      weeklyTotal: baselineTotal,
    };
  }

  const dailyPointsTotal = weekLogs.reduce((sum, log) => sum + getPointsValue(log), 0);
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
    const priorWeekLogs = logs.filter(
      (log) => log.name === participant.name && Number(log.challengeWeek) === week
    );
    if (!priorWeekLogs.length) continue;

    const priorDailyTotal = priorWeekLogs.reduce((sum, log) => sum + getPointsValue(log), 0);
    const priorActiveDays = priorWeekLogs.filter((log) => isActiveDay(log)).length;
    const priorConsistency = calculateConsistencyBonus(priorActiveDays);
    const priorAvgActive = priorWeekLogs.reduce(
      (sum, log) => sum + Number(log.activeMinutes || 0),
      0
    ) / priorWeekLogs.length;
    const priorAvgSteps = priorWeekLogs.reduce(
      (sum, log) => sum + Number(log.steps || 0),
      0
    ) / priorWeekLogs.length;
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
