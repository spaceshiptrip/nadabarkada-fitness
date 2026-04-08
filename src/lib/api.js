import { calculateDailyPoints, getChallengeWeek } from '@/lib/points';

const APP_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL?.trim();

const mockParticipants = [
  {
    name: 'Jay',
    deviceType: 'Garmin',
    teamName: 'Trail Blazers',
    baselineActiveMinutes: 35,
    baselineSteps: 7800,
    active: true,
  },
  {
    name: 'Maria',
    deviceType: 'Apple Watch',
    teamName: 'Consistency Crew',
    baselineActiveMinutes: 18,
    baselineSteps: 5200,
    active: true,
  },
];

const mockDailyLogs = [
  {
    date: '2026-05-04',
    name: 'Jay',
    activeMinutes: 52,
    workoutDone: true,
    steps: 12400,
    mobilityDone: false,
    notes: 'Hill run',
  },
  {
    date: '2026-05-04',
    name: 'Maria',
    activeMinutes: 28,
    workoutDone: true,
    steps: 8600,
    mobilityDone: true,
    notes: 'Walk + stretch',
  },
];

function withComputedDailyPoints(entry) {
  return {
    ...entry,
    challengeWeek: getChallengeWeek(entry.date),
    dailyPoints: calculateDailyPoints(entry),
  };
}

function buildMockLeaderboard() {
  const participants = mockParticipants.map((p) => ({ ...p }));
  const logs = mockDailyLogs.map(withComputedDailyPoints);

  return participants.map((participant) => {
    const personLogs = logs.filter((log) => log.name === participant.name);
    const totalPoints = personLogs.reduce((sum, log) => sum + log.dailyPoints, 0);
    return {
      name: participant.name,
      deviceType: participant.deviceType,
      teamName: participant.teamName,
      baselineActiveMinutes: participant.baselineActiveMinutes,
      baselineSteps: participant.baselineSteps,
      totalPoints,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function postJson(payload) {
  const response = await fetch(APP_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export async function getParticipants() {
  if (!APP_SCRIPT_URL) {
    return { ok: true, data: mockParticipants, source: 'mock' };
  }
  const url = `${APP_SCRIPT_URL}?action=participants`;
  return fetchJson(url);
}

export async function addParticipant(payload) {
  if (!APP_SCRIPT_URL) {
    return { ok: true, data: payload, source: 'mock' };
  }
  return postJson({ action: 'addParticipant', ...payload });
}

export async function getLeaderboard() {
  if (!APP_SCRIPT_URL) {
    return { ok: true, data: buildMockLeaderboard(), source: 'mock' };
  }
  const url = `${APP_SCRIPT_URL}?action=leaderboard`;
  return fetchJson(url);
}

export async function getWeeklySummary() {
  if (!APP_SCRIPT_URL) {
    return {
      ok: true,
      data: [
        {
          name: 'Jay',
          week: 1,
          dailyPointsTotal: 10,
          consistencyBonus: 3,
          improvementBonus: 5,
          personalBestBonus: 2,
          weeklyTotal: 20,
        },
        {
          name: 'Maria',
          week: 1,
          dailyPointsTotal: 8,
          consistencyBonus: 3,
          improvementBonus: 3,
          personalBestBonus: 2,
          weeklyTotal: 16,
        },
      ],
      source: 'mock',
    };
  }
  const url = `${APP_SCRIPT_URL}?action=weeklySummary`;
  return fetchJson(url);
}

export async function logDailyEntry(payload) {
  if (!APP_SCRIPT_URL) {
    return {
      ok: true,
      data: {
        ...payload,
        dailyPoints: calculateDailyPoints(payload),
        challengeWeek: getChallengeWeek(payload.date),
      },
      source: 'mock',
    };
  }
  return postJson({ action: 'logDailyEntry', ...payload });
}
