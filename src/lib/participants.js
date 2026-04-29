import {
  calculateActiveMinutesImprovementBonus,
  calculateConsistencyBonus,
  calculateStepsImprovementBonus,
  getChallengeWeek,
  getScoringWeekNumbers,
  isActiveDay,
} from '@/lib/points';

const DEFAULT_AVATAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <defs>
    <linearGradient id="avatarGradient" x1="12" y1="8" x2="84" y2="88" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D8EAFE"/>
      <stop offset="1" stop-color="#93C5FD"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="48" fill="url(#avatarGradient)"/>
  <circle cx="48" cy="36" r="16" fill="#F8FAFC"/>
  <path d="M22 78c4-13 15-21 26-21s22 8 26 21" fill="#F8FAFC"/>
</svg>
`.trim();

export const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(DEFAULT_AVATAR_SVG)}`;

export function getParticipantProfileImage(profileImage) {
  if (!profileImage) return DEFAULT_PROFILE_IMAGE;

  // Google Sheets can inject newlines/whitespace into long cell values — strip them
  const cleaned = String(profileImage).replace(/\s+/g, '');
  if (!cleaned) return DEFAULT_PROFILE_IMAGE;

  // Must be a data URI or a real URL to be renderable
  if (!cleaned.startsWith('data:') && !cleaned.startsWith('http')) return DEFAULT_PROFILE_IMAGE;

  // Reject obviously truncated data URIs (base64 section must be non-empty)
  if (cleaned.startsWith('data:')) {
    const commaIdx = cleaned.indexOf(',');
    if (commaIdx === -1 || commaIdx === cleaned.length - 1) return DEFAULT_PROFILE_IMAGE;
  }

  // Normalise all SVG data URIs: ensure width/height are present and convert to
  // base64 encoding (more reliable than URL-encoding for <img> src across browsers).
  if (/^data:image\/svg\+xml/i.test(cleaned)) {
    try {
      const commaIdx = cleaned.indexOf(',');
      const header = cleaned.slice(0, commaIdx).toLowerCase();
      const body = cleaned.slice(commaIdx + 1);

      // Decode to raw SVG text regardless of original encoding
      const svgText = header.includes('base64')
        ? atob(body)
        : decodeURIComponent(body);

      // Inject width/height if missing so browsers can size the <img>
      const fixed = /<svg[^>]*\bwidth=/i.test(svgText)
        ? svgText
        : svgText.replace(/<svg\b/, '<svg width="96" height="96"');

      // Re-emit as base64 — avoids URL-encoding quirks in img src
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(fixed)));
    } catch {
      // fall through
    }
  }

  return cleaned;
}

export function normalizeParticipant(participant) {
  return {
    ...participant,
    id: participant?.id || participant?.userId || '',
    baselineActiveMinutes: Number(participant?.baselineActiveMinutes || 0),
    baselineSteps: Number(participant?.baselineSteps || 0),
    baselineOverride: Boolean(participant?.baselineOverride),
    profileImage: getParticipantProfileImage(participant?.profileImage),
  };
}

export function getParticipantKey(participant) {
  return String(participant?.id || participant?.userId || participant?.name || '');
}

export function matchesParticipant(participant, log) {
  const participantId = String(participant?.id || participant?.userId || '').trim();
  const logParticipantId = String(log?.participantId || '').trim();

  if (participantId && logParticipantId) return participantId === logParticipantId;
  return String(participant?.name || '').trim() === String(log?.name || '').trim();
}

export function getParticipantBaselineMetrics(participant, logs) {
  const baselineLogs = logs.filter(
    (log) => matchesParticipant(participant, log) && getChallengeWeek(log.date) === 0
  );

  const loggedDays = baselineLogs.length;
  const computedActiveMinutes = loggedDays
    ? baselineLogs.reduce((sum, log) => sum + Number(log.activeMinutes || 0), 0) / loggedDays
    : 0;
  const computedSteps = loggedDays
    ? baselineLogs.reduce((sum, log) => sum + Number(log.steps || 0), 0) / loggedDays
    : 0;

  const manualActiveMinutes = Number(participant.baselineActiveMinutes || 0);
  const manualSteps = Number(participant.baselineSteps || 0);
  const hasOverride = Boolean(participant.baselineOverride);

  return {
    computedActiveMinutes,
    computedSteps,
    loggedDays,
    effectiveActiveMinutes: hasOverride ? manualActiveMinutes : computedActiveMinutes,
    effectiveSteps: hasOverride ? manualSteps : computedSteps,
    baselineSource: hasOverride ? 'manual' : 'computed',
  };
}

export function mergeParticipantsWithBaselines(participants, logs) {
  return participants.map((participant) => {
    const normalized = normalizeParticipant(participant);
    const metrics = getParticipantBaselineMetrics(normalized, logs);

    return {
      ...normalized,
      computedBaselineActiveMinutes: metrics.computedActiveMinutes,
      computedBaselineSteps: metrics.computedSteps,
      baselineLoggedDays: metrics.loggedDays,
      effectiveBaselineActiveMinutes: metrics.effectiveActiveMinutes,
      effectiveBaselineSteps: metrics.effectiveSteps,
      baselineSource: metrics.baselineSource,
    };
  });
}

// Pre-competition leaderboard: sums daily points across test weeks (W-2, W-1).
// Baseline week (W0) is tracked for baseline averages but is not scored.
export function buildPreCompLeaderboardRows(participants, logs) {
  return participants
    .map((participant) => {
      const preCompLogs = logs.filter(
        (log) =>
          matchesParticipant(participant, log) &&
          log.challengeWeek !== null &&
          log.challengeWeek < 0
      );
      const totalPoints = preCompLogs.reduce((sum, log) => sum + Number(log.dailyPoints || 0), 0);
      return {
        name: participant.name,
        deviceType: participant.deviceType,
        teamName: participant.teamName,
        profileImage: participant.profileImage,
        totalPoints,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export function buildLeaderboardRows(participants, logs) {
  const participantsWithBaselines = mergeParticipantsWithBaselines(participants, logs);

  return participantsWithBaselines
    .map((participant) => {
      const scoredLogs = logs.filter(
        (log) => matchesParticipant(participant, log) && Number(log.challengeWeek) >= 1
      );
      const dailyTotal = scoredLogs.reduce((sum, log) => sum + Number(log.dailyPoints || 0), 0);
      const weeklyBonuses = calculateWeeklyBonusesForParticipant(participant, logs);

      return {
        name: participant.name,
        deviceType: participant.deviceType,
        teamName: participant.teamName,
        profileImage: participant.profileImage,
        baselineActiveMinutes: roundBaseline(participant.effectiveBaselineActiveMinutes),
        baselineSteps: roundBaseline(participant.effectiveBaselineSteps),
        totalPoints: dailyTotal + weeklyBonuses,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

export function buildWeeklySummaryRows(participants, logs) {
  const participantsWithBaselines = mergeParticipantsWithBaselines(participants, logs);
  const results = [];
  const summaryWeeks = [0, ...getScoringWeekNumbers()];

  participantsWithBaselines.forEach((participant) => {
    const personLogs = logs.filter((log) => matchesParticipant(participant, log));
    let priorBest = 0;

    summaryWeeks.forEach((week) => {
      const weekLogs = personLogs.filter((log) => Number(log.challengeWeek) === week);
      if (!weekLogs.length) return;

      if (week === 0) {
        results.push({
          name: participant.name,
          week,
          dailyPointsTotal: 0,
          consistencyBonus: 0,
          improvementBonus: 0,
          personalBestBonus: 0,
          weeklyTotal: 0,
        });
        return;
      }

      const dailyPointsTotal = weekLogs.reduce((sum, log) => sum + Number(log.dailyPoints || 0), 0);
      const activeDays = weekLogs.filter((log) => isActiveDay(log)).length;
      const consistencyBonus = calculateConsistencyBonus(activeDays);
      const avgActiveMinutes =
        weekLogs.reduce((sum, log) => sum + Number(log.activeMinutes || 0), 0) / weekLogs.length;
      const avgSteps =
        weekLogs.reduce((sum, log) => sum + Number(log.steps || 0), 0) / weekLogs.length;
      const activeMinutesBonus = calculateActiveMinutesImprovementBonus(
        participant.effectiveBaselineActiveMinutes,
        avgActiveMinutes
      );
      const stepsBonus = calculateStepsImprovementBonus(
        participant.effectiveBaselineSteps,
        avgSteps
      );
      const improvementBonus = activeMinutesBonus + stepsBonus;
      const subtotal = dailyPointsTotal + consistencyBonus + improvementBonus;
      const personalBestBonus = subtotal > priorBest ? 2 : 0;

      if (subtotal > priorBest) priorBest = subtotal;

      results.push({
        name: participant.name,
        week,
        dailyPointsTotal,
        consistencyBonus,
        improvementBonus,
        personalBestBonus,
        weeklyTotal: subtotal + personalBestBonus,
      });
    });
  });

  return results.sort((a, b) => {
    if (a.week === b.week) return b.weeklyTotal - a.weeklyTotal;
    return a.week - b.week;
  });
}

function calculateWeeklyBonusesForParticipant(participant, logs) {
  const personLogs = logs.filter((log) => matchesParticipant(participant, log));
  let totalBonuses = 0;
  let priorBest = 0;

  getScoringWeekNumbers().forEach((week) => {
    const weekLogs = personLogs.filter((log) => Number(log.challengeWeek) === week);
    if (!weekLogs.length) return;

    const activeDays = weekLogs.filter((log) => isActiveDay(log)).length;
    const consistencyBonus = calculateConsistencyBonus(activeDays);
    const avgActiveMinutes =
      weekLogs.reduce((sum, log) => sum + Number(log.activeMinutes || 0), 0) / weekLogs.length;
    const avgSteps =
      weekLogs.reduce((sum, log) => sum + Number(log.steps || 0), 0) / weekLogs.length;
    const activeMinutesBonus = calculateActiveMinutesImprovementBonus(
      participant.effectiveBaselineActiveMinutes,
      avgActiveMinutes
    );
    const stepsBonus = calculateStepsImprovementBonus(
      participant.effectiveBaselineSteps,
      avgSteps
    );
    const dailyPointsTotal = weekLogs.reduce((sum, log) => sum + Number(log.dailyPoints || 0), 0);
    const subtotal = dailyPointsTotal + consistencyBonus + activeMinutesBonus + stepsBonus;
    const personalBestBonus = subtotal > priorBest ? 2 : 0;

    if (subtotal > priorBest) priorBest = subtotal;
    totalBonuses += consistencyBonus + activeMinutesBonus + stepsBonus + personalBestBonus;
  });

  return totalBonuses;
}

function roundBaseline(value) {
  return Math.round(Number(value || 0));
}
