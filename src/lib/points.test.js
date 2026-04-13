import { describe, it, expect } from 'vitest';
import {
  calculateActivityPoints,
  calculateWorkoutPoints,
  calculateStepsPoints,
  calculateMobilityPoints,
  calculateDailyPoints,
  calculateConsistencyBonus,
  calculateActiveMinutesImprovementBonus,
  calculateStepsImprovementBonus,
  getChallengeWeek,
  getWeeklyDateRanges,
  getScoringWeekNumbers,
  isActiveDay,
} from './points.js';

// ---------------------------------------------------------------------------
// Daily point components
// ---------------------------------------------------------------------------

describe('calculateActivityPoints', () => {
  it('returns 0 for < 10 minutes', () => expect(calculateActivityPoints(9)).toBe(0));
  it('returns 1 for 10–19 minutes', () => expect(calculateActivityPoints(10)).toBe(1));
  it('returns 1 for 19 minutes', () => expect(calculateActivityPoints(19)).toBe(1));
  it('returns 2 for 20–29 minutes', () => expect(calculateActivityPoints(20)).toBe(2));
  it('returns 3 for 30–44 minutes', () => expect(calculateActivityPoints(30)).toBe(3));
  it('returns 4 for 45–59 minutes', () => expect(calculateActivityPoints(45)).toBe(4));
  it('returns 5 for 60+ minutes', () => expect(calculateActivityPoints(60)).toBe(5));
  it('returns 5 for 90 minutes', () => expect(calculateActivityPoints(90)).toBe(5));
  it('handles 0', () => expect(calculateActivityPoints(0)).toBe(0));
  it('handles non-numeric gracefully', () => expect(calculateActivityPoints(undefined)).toBe(0));
});

describe('calculateWorkoutPoints', () => {
  it('returns 2 when done', () => expect(calculateWorkoutPoints(true)).toBe(2));
  it('returns 0 when not done', () => expect(calculateWorkoutPoints(false)).toBe(0));
});

describe('calculateStepsPoints', () => {
  it('returns 0 for < 6000', () => expect(calculateStepsPoints(5999)).toBe(0));
  it('returns 1 for 6000–7999', () => expect(calculateStepsPoints(6000)).toBe(1));
  it('returns 2 for 8000–9999', () => expect(calculateStepsPoints(8000)).toBe(2));
  it('returns 3 for 10000+', () => expect(calculateStepsPoints(10000)).toBe(3));
  it('returns 3 for 15000', () => expect(calculateStepsPoints(15000)).toBe(3));
});

describe('calculateMobilityPoints', () => {
  it('returns 1 when done', () => expect(calculateMobilityPoints(true)).toBe(1));
  it('returns 0 when not done', () => expect(calculateMobilityPoints(false)).toBe(0));
});

describe('calculateDailyPoints', () => {
  it('sums all components correctly', () => {
    // 60+ min (5) + workout (2) + 10k steps (3) + mobility (1) = 11 → capped at 10
    expect(calculateDailyPoints({ activeMinutes: 60, workoutDone: true, steps: 10000, mobilityDone: true })).toBe(10);
  });

  it('caps at 10', () => {
    expect(calculateDailyPoints({ activeMinutes: 90, workoutDone: true, steps: 15000, mobilityDone: true })).toBe(10);
  });

  it('scores a rest day as 0', () => {
    expect(calculateDailyPoints({ activeMinutes: 0, workoutDone: false, steps: 0, mobilityDone: false })).toBe(0);
  });

  it('scores a light day correctly', () => {
    // 20 min (2) + no workout (0) + 6000 steps (1) + no mobility (0) = 3
    expect(calculateDailyPoints({ activeMinutes: 20, workoutDone: false, steps: 6000, mobilityDone: false })).toBe(3);
  });

  it('uses defaults for missing fields', () => {
    expect(calculateDailyPoints({})).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isActiveDay
// ---------------------------------------------------------------------------

describe('isActiveDay', () => {
  it('true if activeMinutes >= 10', () => expect(isActiveDay({ activeMinutes: 10, workoutDone: false })).toBe(true));
  it('true if workoutDone even with 0 minutes', () => expect(isActiveDay({ activeMinutes: 0, workoutDone: true })).toBe(true));
  it('false if < 10 minutes and no workout', () => expect(isActiveDay({ activeMinutes: 9, workoutDone: false })).toBe(false));
  it('false on rest day', () => expect(isActiveDay({ activeMinutes: 0, workoutDone: false })).toBe(false));
});

// ---------------------------------------------------------------------------
// Consistency bonus
// ---------------------------------------------------------------------------

describe('calculateConsistencyBonus', () => {
  it('0 bonus for 0 active days', () => expect(calculateConsistencyBonus(0)).toBe(0));
  it('0 bonus for 2 active days', () => expect(calculateConsistencyBonus(2)).toBe(0));
  it('3 bonus for 3 active days', () => expect(calculateConsistencyBonus(3)).toBe(3));
  it('3 bonus for 4 active days', () => expect(calculateConsistencyBonus(4)).toBe(3));
  it('6 bonus for 5 active days', () => expect(calculateConsistencyBonus(5)).toBe(6));
  it('8 bonus for 6 active days', () => expect(calculateConsistencyBonus(6)).toBe(8));
  it('8 bonus for 7 active days (max)', () => expect(calculateConsistencyBonus(7)).toBe(8));
});

// ---------------------------------------------------------------------------
// Active minutes improvement bonus
// ---------------------------------------------------------------------------

describe('calculateActiveMinutesImprovementBonus', () => {
  it('returns 0 if no baseline', () => expect(calculateActiveMinutesImprovementBonus(0, 60)).toBe(0));
  it('returns 0 if weekly avg <= baseline', () => expect(calculateActiveMinutesImprovementBonus(40, 40)).toBe(0));
  it('returns 0 for < 10% improvement', () => expect(calculateActiveMinutesImprovementBonus(40, 43)).toBe(0));
  it('returns 3 for 10–19% improvement', () => {
    // +10% of 40 = 44
    expect(calculateActiveMinutesImprovementBonus(40, 44)).toBe(3);
  });
  it('returns 5 for 20–29% improvement', () => {
    // +20% of 40 = 48
    expect(calculateActiveMinutesImprovementBonus(40, 48)).toBe(5);
  });
  it('returns 7 for 30%+ improvement', () => {
    // +30% of 40 = 52
    expect(calculateActiveMinutesImprovementBonus(40, 52)).toBe(7);
  });
  it('returns 7 for large improvement', () => {
    expect(calculateActiveMinutesImprovementBonus(30, 60)).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Steps improvement bonus
// ---------------------------------------------------------------------------

describe('calculateStepsImprovementBonus', () => {
  it('returns 0 if no baseline', () => expect(calculateStepsImprovementBonus(0, 12000)).toBe(0));
  it('returns 0 if weekly avg <= baseline', () => expect(calculateStepsImprovementBonus(8000, 8000)).toBe(0));
  it('returns 0 for < 10% improvement', () => expect(calculateStepsImprovementBonus(8000, 8700)).toBe(0));
  it('returns 1 for 10–19% improvement', () => {
    // +10% of 8000 = 8800
    expect(calculateStepsImprovementBonus(8000, 8800)).toBe(1);
  });
  it('returns 2 for 20%+ improvement', () => {
    // +20% of 8000 = 9600
    expect(calculateStepsImprovementBonus(8000, 9600)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getChallengeWeek — date → week number mapping
// ---------------------------------------------------------------------------

describe('getChallengeWeek', () => {
  it('returns null before test period (Apr 12)', () => expect(getChallengeWeek('2026-04-12')).toBeNull());
  it('returns -2 for W-2 start (Apr 13)', () => expect(getChallengeWeek('2026-04-13')).toBe(-2));
  it('returns -2 for W-2 end (Apr 19)', () => expect(getChallengeWeek('2026-04-19')).toBe(-2));
  it('returns -1 for W-1 start (Apr 20)', () => expect(getChallengeWeek('2026-04-20')).toBe(-1));
  it('returns -1 for W-1 end (Apr 26)', () => expect(getChallengeWeek('2026-04-26')).toBe(-1));
  it('returns 0 for baseline start (Apr 27)', () => expect(getChallengeWeek('2026-04-27')).toBe(0));
  it('returns 0 for baseline end (May 3)', () => expect(getChallengeWeek('2026-05-03')).toBe(0));
  it('returns 1 for W1 start (May 4)', () => expect(getChallengeWeek('2026-05-04')).toBe(1));
  it('returns 1 for W1 end (May 10)', () => expect(getChallengeWeek('2026-05-10')).toBe(1));
  it('returns 2 for W2 start (May 11)', () => expect(getChallengeWeek('2026-05-11')).toBe(2));
  it('returns 4 for last week (May 25)', () => expect(getChallengeWeek('2026-05-25')).toBe(4));
  it('returns null after challenge end (Jun 1)', () => expect(getChallengeWeek('2026-06-01')).toBeNull());
});

// ---------------------------------------------------------------------------
// getWeeklyDateRanges — structure checks
// ---------------------------------------------------------------------------

describe('getWeeklyDateRanges', () => {
  const ranges = getWeeklyDateRanges();

  it('includes W-2, W-1, W0, W1–W4 (7 total)', () => expect(ranges).toHaveLength(7));

  it('first range is W-2 starting Apr 13', () => {
    expect(ranges[0].weekNumber).toBe(-2);
    expect(ranges[0].start).toBe('2026-04-13');
    expect(ranges[0].end).toBe('2026-04-19');
  });

  it('second range is W-1 starting Apr 20', () => {
    expect(ranges[1].weekNumber).toBe(-1);
    expect(ranges[1].start).toBe('2026-04-20');
    expect(ranges[1].end).toBe('2026-04-26');
  });

  it('third range is baseline (W0) starting Apr 27', () => {
    expect(ranges[2].weekNumber).toBe(0);
    expect(ranges[2].start).toBe('2026-04-27');
  });

  it('W1 starts May 4', () => {
    const w1 = ranges.find((r) => r.weekNumber === 1);
    expect(w1.start).toBe('2026-05-04');
  });

  it('all labels are defined strings', () => {
    ranges.forEach((r) => expect(typeof r.label).toBe('string'));
  });
});

// ---------------------------------------------------------------------------
// getScoringWeekNumbers — only competition weeks (>= 1)
// ---------------------------------------------------------------------------

describe('getScoringWeekNumbers', () => {
  it('only includes weeks >= 1', () => {
    const weeks = getScoringWeekNumbers();
    expect(weeks.every((w) => w >= 1)).toBe(true);
  });

  it('starts at 1', () => expect(getScoringWeekNumbers()[0]).toBe(1));

  it('does not include test weeks or baseline', () => {
    const weeks = getScoringWeekNumbers();
    expect(weeks).not.toContain(-2);
    expect(weeks).not.toContain(-1);
    expect(weeks).not.toContain(0);
  });
});

// ---------------------------------------------------------------------------
// End-to-end weekly standing scenarios
// These replicate the logic in WeekRingsCalendar.getWeeklyStanding to verify
// the full bonus stack against known inputs.
// ---------------------------------------------------------------------------

/**
 * Minimal stand-alone implementation of getWeeklyStanding so we can test it
 * without importing the React component.
 */
function weeklyStanding(participant, logs, weekNumber) {
  const weekLogs = logs.filter((log) => log.challengeWeek === weekNumber);

  if (weekNumber <= 0) {
    return {
      consistencyBonus: 0,
      improvementBonus: 0,
      personalBestBonus: 0,
      weeklyTotal: weekLogs.reduce((s, l) => s + l.dailyPoints, 0),
    };
  }

  const dailyTotal = weekLogs.reduce((s, l) => s + l.dailyPoints, 0);
  const activeDays = weekLogs.filter((l) => isActiveDay(l)).length;
  const consistencyBonus = calculateConsistencyBonus(activeDays);

  const avgActiveMinutes = weekLogs.length
    ? weekLogs.reduce((s, l) => s + (l.activeMinutes || 0), 0) / weekLogs.length
    : 0;
  const avgSteps = weekLogs.length
    ? weekLogs.reduce((s, l) => s + (l.steps || 0), 0) / weekLogs.length
    : 0;

  const baselineActive = participant.effectiveBaselineActiveMinutes || 0;
  const baselineSteps  = participant.effectiveBaselineSteps || 0;
  const improvementBonus =
    calculateActiveMinutesImprovementBonus(baselineActive, avgActiveMinutes) +
    calculateStepsImprovementBonus(baselineSteps, avgSteps);

  // Personal best vs prior competition weeks
  let priorBest = 0;
  for (let w = 1; w < weekNumber; w++) {
    const priorLogs = logs.filter((l) => l.challengeWeek === w);
    if (!priorLogs.length) continue;
    const priorDaily = priorLogs.reduce((s, l) => s + l.dailyPoints, 0);
    const priorActiveDays = priorLogs.filter((l) => isActiveDay(l)).length;
    const priorConsistency = calculateConsistencyBonus(priorActiveDays);
    const priorAvgActive = priorLogs.reduce((s, l) => s + (l.activeMinutes || 0), 0) / priorLogs.length;
    const priorAvgSteps  = priorLogs.reduce((s, l) => s + (l.steps || 0), 0) / priorLogs.length;
    const priorImprovement =
      calculateActiveMinutesImprovementBonus(baselineActive, priorAvgActive) +
      calculateStepsImprovementBonus(baselineSteps, priorAvgSteps);
    const priorSubtotal = priorDaily + priorConsistency + priorImprovement;
    if (priorSubtotal > priorBest) priorBest = priorSubtotal;
  }

  const subtotal = dailyTotal + consistencyBonus + improvementBonus;
  const personalBestBonus = weekLogs.length > 0 && subtotal > priorBest ? 2 : 0;

  return { consistencyBonus, improvementBonus, personalBestBonus, weeklyTotal: subtotal + personalBestBonus };
}

// Helpers to build realistic log entries
function makeLog(date, challengeWeek, { activeMinutes = 0, workoutDone = false, steps = 0, mobilityDone = false } = {}) {
  return {
    date,
    challengeWeek,
    activeMinutes,
    workoutDone,
    steps,
    mobilityDone,
    dailyPoints: calculateDailyPoints({ activeMinutes, workoutDone, steps, mobilityDone }),
  };
}

// Participant with known baseline
const participant = {
  effectiveBaselineActiveMinutes: 40,
  effectiveBaselineSteps: 8000,
};

// Participant with no baseline (improvement bonuses should always be 0)
const noBaselineParticipant = {
  effectiveBaselineActiveMinutes: 0,
  effectiveBaselineSteps: 0,
};

describe('weekly standing — test/baseline weeks (no bonuses)', () => {
  const logs = [
    makeLog('2026-04-13', -2, { activeMinutes: 45, workoutDone: true, steps: 10000 }),
    makeLog('2026-04-14', -2, { activeMinutes: 30, steps: 8000 }),
    makeLog('2026-04-15', -2, { activeMinutes: 60, workoutDone: true, steps: 12000, mobilityDone: true }),
  ];

  it('W-2: sums daily points only, no bonuses', () => {
    const result = weeklyStanding(participant, logs, -2);
    const expectedDaily = logs.reduce((s, l) => s + l.dailyPoints, 0);
    expect(result.weeklyTotal).toBe(expectedDaily);
    expect(result.consistencyBonus).toBe(0);
    expect(result.improvementBonus).toBe(0);
    expect(result.personalBestBonus).toBe(0);
  });

  it('W-1: same — no bonuses', () => {
    const w1Logs = [makeLog('2026-04-20', -1, { activeMinutes: 50, steps: 9000 })];
    const result = weeklyStanding(participant, w1Logs, -1);
    expect(result.consistencyBonus).toBe(0);
    expect(result.improvementBonus).toBe(0);
  });

  it('W0 baseline: no bonuses', () => {
    const baselineLogs = [makeLog('2026-04-27', 0, { activeMinutes: 40, steps: 8000 })];
    const result = weeklyStanding(participant, baselineLogs, 0);
    expect(result.consistencyBonus).toBe(0);
    expect(result.improvementBonus).toBe(0);
  });
});

describe('weekly standing — consistency bonus (W1)', () => {
  it('0 bonus for 2 active days', () => {
    const logs = [
      makeLog('2026-05-04', 1, { activeMinutes: 30 }),
      makeLog('2026-05-05', 1, { activeMinutes: 30 }),
    ];
    expect(weeklyStanding(participant, logs, 1).consistencyBonus).toBe(0);
  });

  it('3 bonus for exactly 3 active days', () => {
    const logs = [
      makeLog('2026-05-04', 1, { activeMinutes: 30 }),
      makeLog('2026-05-05', 1, { activeMinutes: 30 }),
      makeLog('2026-05-06', 1, { activeMinutes: 30 }),
    ];
    expect(weeklyStanding(participant, logs, 1).consistencyBonus).toBe(3);
  });

  it('6 bonus for 5 active days', () => {
    const logs = Array.from({ length: 5 }, (_, i) =>
      makeLog(`2026-05-0${4 + i}`, 1, { activeMinutes: 30 })
    );
    expect(weeklyStanding(participant, logs, 1).consistencyBonus).toBe(6);
  });

  it('8 bonus for 6 active days', () => {
    const logs = Array.from({ length: 6 }, (_, i) =>
      makeLog(`2026-05-0${4 + i}`, 1, { activeMinutes: 30 })
    );
    expect(weeklyStanding(participant, logs, 1).consistencyBonus).toBe(8);
  });

  it('rest day (9 min, no workout) does not count as active', () => {
    const logs = [
      makeLog('2026-05-04', 1, { activeMinutes: 9 }),  // NOT active
      makeLog('2026-05-05', 1, { activeMinutes: 30 }),
      makeLog('2026-05-06', 1, { activeMinutes: 30 }),
      makeLog('2026-05-07', 1, { activeMinutes: 30 }),
    ];
    // Only 3 active days → 3 bonus
    expect(weeklyStanding(participant, logs, 1).consistencyBonus).toBe(3);
  });
});

describe('weekly standing — active minutes improvement bonus (W1)', () => {
  // baseline = 40 min/day

  it('0 bonus when avg equals baseline', () => {
    const logs = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-05-0${4 + i}`, 1, { activeMinutes: 40 })
    );
    expect(weeklyStanding(participant, logs, 1).improvementBonus).toBe(0);
  });

  it('3 bonus for ~10% improvement over baseline', () => {
    // 40 * 1.10 = 44 min avg
    const logs = Array.from({ length: 7 }, () =>
      makeLog('2026-05-04', 1, { activeMinutes: 44 })
    );
    expect(weeklyStanding(participant, logs, 1).improvementBonus).toBeGreaterThanOrEqual(3);
  });

  it('7 bonus for 30%+ improvement over baseline', () => {
    // 40 * 1.30 = 52 min avg
    const logs = Array.from({ length: 7 }, () =>
      makeLog('2026-05-04', 1, { activeMinutes: 52 })
    );
    const result = weeklyStanding(participant, logs, 1);
    expect(result.improvementBonus).toBeGreaterThanOrEqual(7);
  });

  it('0 bonus when participant has no baseline', () => {
    const logs = Array.from({ length: 7 }, () =>
      makeLog('2026-05-04', 1, { activeMinutes: 90 })
    );
    expect(weeklyStanding(noBaselineParticipant, logs, 1).improvementBonus).toBe(0);
  });
});

describe('weekly standing — steps improvement bonus (W1)', () => {
  // baseline = 8000 steps/day

  it('0 bonus when avg equals baseline', () => {
    const logs = Array.from({ length: 7 }, () =>
      makeLog('2026-05-04', 1, { steps: 8000 })
    );
    expect(weeklyStanding(participant, logs, 1).improvementBonus).toBe(0);
  });

  it('1 bonus for 10–19% improvement', () => {
    // 8000 * 1.10 = 8800
    const logs = Array.from({ length: 7 }, () =>
      makeLog('2026-05-04', 1, { steps: 8800 })
    );
    expect(weeklyStanding(participant, logs, 1).improvementBonus).toBe(1);
  });

  it('2 bonus for 20%+ improvement', () => {
    // 8000 * 1.20 = 9600
    const logs = Array.from({ length: 7 }, () =>
      makeLog('2026-05-04', 1, { steps: 9600 })
    );
    expect(weeklyStanding(participant, logs, 1).improvementBonus).toBe(2);
  });
});

describe('weekly standing — combined active minutes + steps bonus', () => {
  it('stacks correctly (max active + max steps)', () => {
    // 40 * 1.3 = 52 min avg → +7; 8000 * 1.2 = 9600 steps → +2 = 9 total improvement
    const logs = Array.from({ length: 7 }, () =>
      makeLog('2026-05-04', 1, { activeMinutes: 52, steps: 9600 })
    );
    expect(weeklyStanding(participant, logs, 1).improvementBonus).toBe(9);
  });
});

describe('weekly standing — personal best bonus', () => {
  const sevenActiveLogs = (weekNum, mins, steps) =>
    Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-05-${String(4 + i + (weekNum - 1) * 7).padStart(2, '0')}`, weekNum, {
        activeMinutes: mins,
        steps,
        workoutDone: true,
      })
    );

  it('earns personal best bonus on W1 (no prior week)', () => {
    const logs = sevenActiveLogs(1, 50, 9000);
    expect(weeklyStanding(participant, logs, 1).personalBestBonus).toBe(2);
  });

  it('no personal best bonus when W2 is worse than W1', () => {
    const w1Logs = sevenActiveLogs(1, 52, 9600); // strong week
    const w2Logs = sevenActiveLogs(2, 40, 8000); // weaker week
    const allLogs = [...w1Logs, ...w2Logs];
    expect(weeklyStanding(participant, allLogs, 2).personalBestBonus).toBe(0);
  });

  it('earns personal best when W2 beats W1', () => {
    const w1Logs = sevenActiveLogs(1, 40, 8000); // baseline-level
    const w2Logs = sevenActiveLogs(2, 52, 9600); // big improvement
    const allLogs = [...w1Logs, ...w2Logs];
    expect(weeklyStanding(participant, allLogs, 2).personalBestBonus).toBe(2);
  });

  it('no personal best on empty week', () => {
    expect(weeklyStanding(participant, [], 1).personalBestBonus).toBe(0);
  });
});

describe('weekly standing — full weekly total', () => {
  it('totals daily + consistency + improvement + personal best correctly', () => {
    // 7 days, all active, 60 min each (5 pts activity + 2 workout + 3 steps = 10 capped), 10k steps
    // Baseline: 40 min, 8000 steps
    // Avg active: 60 → +50% improvement → +7 active bonus
    // Avg steps: 10000 → +25% improvement → +2 steps bonus
    // 7 active days → consistency = 8
    // Personal best (W1, no prior): +2
    const logs = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-05-${String(4 + i).padStart(2, '0')}`, 1, {
        activeMinutes: 60,
        workoutDone: true,
        steps: 10000,
        mobilityDone: true,
      })
    );
    const result = weeklyStanding(participant, logs, 1);
    const expectedDaily = 7 * 10; // 10 pts/day * 7 days
    expect(result.weeklyTotal).toBe(expectedDaily + 8 + 9 + 2); // 70 + 8 + 9 + 2 = 89
  });
});
