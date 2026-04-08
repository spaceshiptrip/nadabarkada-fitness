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
  // Week 1 — Jay
  { date: '2026-05-04', name: 'Jay', activeMinutes: 52, workoutDone: true,  steps: 12400, mobilityDone: false, notes: 'Hill run' },
  { date: '2026-05-05', name: 'Jay', activeMinutes: 35, workoutDone: false, steps: 9200,  mobilityDone: true,  notes: '' },
  { date: '2026-05-06', name: 'Jay', activeMinutes: 61, workoutDone: true,  steps: 11000, mobilityDone: true,  notes: 'Long ride' },
  { date: '2026-05-07', name: 'Jay', activeMinutes: 20, workoutDone: false, steps: 6500,  mobilityDone: false, notes: '' },
  { date: '2026-05-08', name: 'Jay', activeMinutes: 45, workoutDone: true,  steps: 10200, mobilityDone: false, notes: 'Tempo run' },
  { date: '2026-05-09', name: 'Jay', activeMinutes: 12, workoutDone: false, steps: 4800,  mobilityDone: false, notes: 'Rest day' },
  { date: '2026-05-10', name: 'Jay', activeMinutes: 55, workoutDone: true,  steps: 13100, mobilityDone: true,  notes: '' },
  // Week 1 — Maria
  { date: '2026-05-04', name: 'Maria', activeMinutes: 28, workoutDone: true,  steps: 8600,  mobilityDone: true,  notes: 'Walk + stretch' },
  { date: '2026-05-05', name: 'Maria', activeMinutes: 15, workoutDone: false, steps: 5800,  mobilityDone: false, notes: '' },
  { date: '2026-05-06', name: 'Maria', activeMinutes: 32, workoutDone: true,  steps: 9100,  mobilityDone: true,  notes: '' },
  { date: '2026-05-07', name: 'Maria', activeMinutes: 22, workoutDone: false, steps: 7200,  mobilityDone: false, notes: '' },
  { date: '2026-05-08', name: 'Maria', activeMinutes: 48, workoutDone: true,  steps: 10800, mobilityDone: true,  notes: 'Yoga + walk' },
  { date: '2026-05-09', name: 'Maria', activeMinutes: 19, workoutDone: false, steps: 6100,  mobilityDone: true,  notes: '' },
  { date: '2026-05-10', name: 'Maria', activeMinutes: 38, workoutDone: true,  steps: 9400,  mobilityDone: false, notes: '' },
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
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function postJson(payload) {
  const response = await fetch(APP_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export async function getParticipants() {
  if (!APP_SCRIPT_URL) return { ok: true, data: mockParticipants, source: 'mock' };
  return fetchJson(`${APP_SCRIPT_URL}?action=participants`);
}

export async function addParticipant(payload) {
  if (!APP_SCRIPT_URL) return { ok: true, data: payload, source: 'mock' };
  return postJson({ action: 'addParticipant', ...payload });
}

export async function getLeaderboard() {
  if (!APP_SCRIPT_URL) return { ok: true, data: buildMockLeaderboard(), source: 'mock' };
  return fetchJson(`${APP_SCRIPT_URL}?action=leaderboard`);
}

export async function getDailyLogs() {
  if (!APP_SCRIPT_URL) {
    return { ok: true, data: mockDailyLogs.map(withComputedDailyPoints), source: 'mock' };
  }
  return fetchJson(`${APP_SCRIPT_URL}?action=dailyLogs`);
}

export async function getWeeklySummary() {
  if (!APP_SCRIPT_URL) {
    return {
      ok: true,
      data: [
        { name: 'Jay',   week: 1, dailyPointsTotal: 10, consistencyBonus: 3, improvementBonus: 5, personalBestBonus: 2, weeklyTotal: 20 },
        { name: 'Maria', week: 1, dailyPointsTotal: 8,  consistencyBonus: 3, improvementBonus: 3, personalBestBonus: 2, weeklyTotal: 16 },
      ],
      source: 'mock',
    };
  }
  return fetchJson(`${APP_SCRIPT_URL}?action=weeklySummary`);
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
