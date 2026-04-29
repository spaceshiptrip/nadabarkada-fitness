import { describe, it, expect } from 'vitest';
import { calculateDailyPoints, getChallengeWeek } from './points.js';
import {
  getParticipantBaselineMetrics,
  mergeParticipantsWithBaselines,
  buildPreCompLeaderboardRows,
  buildLeaderboardRows,
  buildWeeklySummaryRows,
} from './participants.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLog(date, { activeMinutes = 0, workoutDone = false, steps = 0, mobilityDone = false } = {}) {
  return {
    date,
    challengeWeek: getChallengeWeek(date),
    participantId: 'p1',
    name: 'Alex',
    activeMinutes,
    workoutDone,
    steps,
    mobilityDone,
    dailyPoints: calculateDailyPoints({ activeMinutes, workoutDone, steps, mobilityDone }),
  };
}

const participant = { id: 'p1', name: 'Alex', baselineActiveMinutes: 0, baselineSteps: 0, baselineOverride: false, profileImage: '' };

// ---------------------------------------------------------------------------
// Baseline is derived ONLY from W0 (Apr 27–May 3) logs
// ---------------------------------------------------------------------------

describe('getParticipantBaselineMetrics — only W0 logs count', () => {
  it('ignores W-2 logs when computing baseline', () => {
    const logs = [
      makeLog('2026-04-13', { activeMinutes: 999, steps: 99999 }), // W-2 — should be ignored
      makeLog('2026-04-27', { activeMinutes: 40,  steps: 8000  }), // W0 baseline day
    ];
    const metrics = getParticipantBaselineMetrics(participant, logs);
    expect(metrics.computedActiveMinutes).toBe(40);
    expect(metrics.computedSteps).toBe(8000);
  });

  it('ignores W-1 logs when computing baseline', () => {
    const logs = [
      makeLog('2026-04-20', { activeMinutes: 999, steps: 99999 }), // W-1 — should be ignored
      makeLog('2026-04-27', { activeMinutes: 40,  steps: 8000  }), // W0 baseline day
    ];
    const metrics = getParticipantBaselineMetrics(participant, logs);
    expect(metrics.computedActiveMinutes).toBe(40);
    expect(metrics.computedSteps).toBe(8000);
  });

  it('ignores W1+ competition logs when computing baseline', () => {
    const logs = [
      makeLog('2026-04-27', { activeMinutes: 40,   steps: 8000  }), // W0
      makeLog('2026-05-04', { activeMinutes: 999, steps: 99999 }), // W1 — should not affect baseline
    ];
    const metrics = getParticipantBaselineMetrics(participant, logs);
    expect(metrics.computedActiveMinutes).toBe(40);
    expect(metrics.computedSteps).toBe(8000);
  });

  it('averages all 7 baseline days correctly', () => {
    // 7 days: 4 days at 40 min, 3 days at 60 min → avg = (4*40 + 3*60) / 7 ≈ 48.57
    const dates = ['2026-04-27','2026-04-28','2026-04-29','2026-04-30','2026-05-01','2026-05-02','2026-05-03'];
    const logs = dates.map((d, i) =>
      makeLog(d, { activeMinutes: i < 4 ? 40 : 60, steps: 8000 })
    );
    const metrics = getParticipantBaselineMetrics(participant, logs);
    const expected = (4 * 40 + 3 * 60) / 7;
    expect(metrics.computedActiveMinutes).toBeCloseTo(expected, 5);
  });

  it('returns 0 when there are no W0 logs at all', () => {
    const logs = [
      makeLog('2026-04-13', { activeMinutes: 60, steps: 10000 }), // W-2 only
    ];
    const metrics = getParticipantBaselineMetrics(participant, logs);
    expect(metrics.computedActiveMinutes).toBe(0);
    expect(metrics.computedSteps).toBe(0);
    expect(metrics.loggedDays).toBe(0);
  });

  it('reports loggedDays as count of W0 days only', () => {
    const logs = [
      makeLog('2026-04-13', { activeMinutes: 30 }), // W-2
      makeLog('2026-04-27', { activeMinutes: 30 }), // W0 day 1
      makeLog('2026-04-28', { activeMinutes: 30 }), // W0 day 2
      makeLog('2026-05-04', { activeMinutes: 30 }), // W1
    ];
    const metrics = getParticipantBaselineMetrics(participant, logs);
    expect(metrics.loggedDays).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// mergeParticipantsWithBaselines — effectiveBaseline uses W0 data
// ---------------------------------------------------------------------------

describe('mergeParticipantsWithBaselines', () => {
  it('attaches computed baseline from W0 logs, ignoring test weeks', () => {
    const logs = [
      makeLog('2026-04-13', { activeMinutes: 999 }), // W-2 noise
      makeLog('2026-04-27', { activeMinutes: 40, steps: 8000 }), // W0
      makeLog('2026-04-28', { activeMinutes: 60, steps: 10000 }), // W0
    ];
    const [merged] = mergeParticipantsWithBaselines([participant], logs);
    expect(merged.effectiveBaselineActiveMinutes).toBe(50); // (40+60)/2
    expect(merged.effectiveBaselineSteps).toBe(9000);       // (8000+10000)/2
  });

  it('manual override takes precedence over computed baseline', () => {
    const overrideParticipant = {
      ...participant,
      baselineActiveMinutes: 55,
      baselineSteps: 7500,
      baselineOverride: true,
    };
    const logs = [makeLog('2026-04-27', { activeMinutes: 40, steps: 8000 })];
    const [merged] = mergeParticipantsWithBaselines([overrideParticipant], logs);
    expect(merged.effectiveBaselineActiveMinutes).toBe(55);
    expect(merged.effectiveBaselineSteps).toBe(7500);
  });
});

// ---------------------------------------------------------------------------
// buildLeaderboardRows — only competition weeks count toward totals
// ---------------------------------------------------------------------------

describe('buildLeaderboardRows — W-2, W-1, and W0 logs excluded from totals', () => {
  it('does not count W-2, W-1, or W0 logs in the leaderboard total', () => {
    const logs = [
      makeLog('2026-04-13', { activeMinutes: 60, workoutDone: true, steps: 10000, mobilityDone: true }), // W-2, 10 pts — excluded
      makeLog('2026-04-20', { activeMinutes: 60, workoutDone: true, steps: 10000, mobilityDone: true }), // W-1, 10 pts — excluded
      makeLog('2026-04-27', { activeMinutes: 60, workoutDone: true, steps: 10000, mobilityDone: true }), // W0, baseline — excluded
      makeLog('2026-05-04', { activeMinutes: 30, workoutDone: false, steps: 6000 }), // W1, 4 daily pts
    ];
    const [row] = buildLeaderboardRows([participant], logs);
    // W1: 4 daily pts + 2 personal best (first competition week, subtotal > 0) = 6
    // W-2, W-1, and W0 pts are NOT included
    expect(row.totalPoints).toBe(6);
  });

  it('does not count W0 baseline logs in the leaderboard total', () => {
    const logs = [
      makeLog('2026-04-27', { activeMinutes: 60, workoutDone: true, steps: 10000, mobilityDone: true }), // W0 — excluded
      makeLog('2026-05-04', { activeMinutes: 30, steps: 6000 }), // W1, 4 daily pts
    ];
    const [row] = buildLeaderboardRows([participant], logs);
    // W1: 4 daily pts + 2 personal best = 6.
    expect(row.totalPoints).toBe(6);
  });

  it('returns 0 total if only test-week or baseline logs exist', () => {
    const logs = [
      makeLog('2026-04-13', { activeMinutes: 60, workoutDone: true, steps: 10000 }),
      makeLog('2026-04-14', { activeMinutes: 60, workoutDone: true, steps: 10000 }),
      makeLog('2026-04-27', { activeMinutes: 60, workoutDone: true, steps: 10000 }),
    ];
    const [row] = buildLeaderboardRows([participant], logs);
    expect(row.totalPoints).toBe(0);
  });

  it('does not let legacy nonzero W0 daily points affect leaderboard or weekly summary', () => {
    const logs = [
      makeLog('2026-04-27', { activeMinutes: 60, workoutDone: true, steps: 10000, mobilityDone: true }),
      makeLog('2026-04-28', { activeMinutes: 45, workoutDone: true, steps: 9000, mobilityDone: true }),
    ];

    expect(logs.every((log) => log.challengeWeek === 0 && log.dailyPoints > 0)).toBe(true);

    const [leaderboardRow] = buildLeaderboardRows([participant], logs);
    expect(leaderboardRow.totalPoints).toBe(0);

    const [summaryRow] = buildWeeklySummaryRows([participant], logs);
    expect(summaryRow.week).toBe(0);
    expect(summaryRow.dailyPointsTotal).toBe(0);
    expect(summaryRow.weeklyTotal).toBe(0);
    expect(summaryRow.consistencyBonus).toBe(0);
    expect(summaryRow.improvementBonus).toBe(0);
    expect(summaryRow.personalBestBonus).toBe(0);
  });

  it('keeps W0 logs out of pre-competition preview standings', () => {
    const logs = [
      makeLog('2026-04-13', { activeMinutes: 20, steps: 6000 }), // W-2 preview, 3 pts
      makeLog('2026-04-27', { activeMinutes: 60, workoutDone: true, steps: 10000, mobilityDone: true }), // W0, 10 pts excluded
    ];

    const [row] = buildPreCompLeaderboardRows([participant], logs);
    expect(row.totalPoints).toBe(3);
  });

  it('counts all W1–W4 daily points in the total', () => {
    // 7 days at 10 pts each in W1
    const w1Logs = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-05-${String(4 + i).padStart(2, '0')}`, {
        activeMinutes: 60, workoutDone: true, steps: 10000, mobilityDone: true,
      })
    );
    const [row] = buildLeaderboardRows([participant], w1Logs);
    // 70 daily pts; no improvement bonus (no baseline); 8 consistency; 2 personal best
    expect(row.totalPoints).toBeGreaterThanOrEqual(70);
  });
});

// ---------------------------------------------------------------------------
// Improvement bonus is computed against W0 baseline, not test weeks
// ---------------------------------------------------------------------------

describe('improvement bonus uses W0 baseline, not test-week averages', () => {
  it('improvement is measured against W0 avg, even if W-2 avg was higher', () => {
    // W-2: logged 90 min/day (very high — should NOT be the baseline)
    // W0:  logged 30 min/day (this IS the baseline)
    // W1:  logged 45 min/day → 50% above W0 baseline → max improvement bonus
    const logs = [
      makeLog('2026-04-13', { activeMinutes: 90, steps: 15000 }), // W-2 — ignored
      makeLog('2026-04-27', { activeMinutes: 30, steps: 6000 }),   // W0 baseline
      ...Array.from({ length: 7 }, () =>
        makeLog('2026-05-04', { activeMinutes: 45, steps: 7200 })  // W1
      ),
    ];

    const [merged] = mergeParticipantsWithBaselines([participant], logs);
    // Baseline should be 30 min / 6000 steps (W0 only), not 90/15000 (W-2)
    expect(merged.effectiveBaselineActiveMinutes).toBe(30);
    expect(merged.effectiveBaselineSteps).toBe(6000);
  });
});
