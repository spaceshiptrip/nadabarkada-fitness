import { calculateDailyPoints, getChallengeWeek } from '@/lib/points';
import {
  buildLeaderboardRows,
  buildWeeklySummaryRows,
  getParticipantKey,
  normalizeParticipant,
} from '@/lib/participants';
import { APP_SCRIPT_URL as CONFIG_APP_SCRIPT_URL } from '@/lib/config';

const APP_SCRIPT_URL = (import.meta.env.VITE_APP_SCRIPT_URL || CONFIG_APP_SCRIPT_URL || '').trim();
const MOCK_PARTICIPANTS_KEY = 'fitness-challenge:participants';
const MOCK_DAILY_LOGS_KEY = 'fitness-challenge:daily-logs';

const mockParticipants = [
  {
    id: 'participant-jay',
    name: 'Jay',
    deviceType: 'Garmin',
    teamName: 'Trail Blazers',
    baselineActiveMinutes: 0,
    baselineSteps: 0,
    baselineOverride: false,
    profileImage: '',
    active: true,
  },
  {
    id: 'participant-maria',
    name: 'Maria',
    deviceType: 'Apple Watch',
    teamName: 'Consistency Crew',
    baselineActiveMinutes: 0,
    baselineSteps: 0,
    baselineOverride: false,
    profileImage: '',
    active: true,
  },
];

const mockDailyLogs = [
  // W-2 (Apr 13–19) — Jay
  { date: '2026-04-13', participantId: 'participant-jay', name: 'Jay', activeMinutes: 40, workoutDone: true,  steps: 9800,  mobilityDone: false, notes: 'Test week kickoff' },
  { date: '2026-04-14', participantId: 'participant-jay', name: 'Jay', activeMinutes: 25, workoutDone: false, steps: 7200,  mobilityDone: true,  notes: '' },
  { date: '2026-04-15', participantId: 'participant-jay', name: 'Jay', activeMinutes: 55, workoutDone: true,  steps: 11500, mobilityDone: false, notes: 'Morning run' },
  { date: '2026-04-16', participantId: 'participant-jay', name: 'Jay', activeMinutes: 18, workoutDone: false, steps: 5600,  mobilityDone: false, notes: '' },
  { date: '2026-04-17', participantId: 'participant-jay', name: 'Jay', activeMinutes: 47, workoutDone: true,  steps: 10100, mobilityDone: true,  notes: 'Bike ride' },
  // W-2 (Apr 13–19) — Maria
  { date: '2026-04-13', participantId: 'participant-maria', name: 'Maria', activeMinutes: 30, workoutDone: true,  steps: 8200,  mobilityDone: true,  notes: 'Walk + stretch' },
  { date: '2026-04-14', participantId: 'participant-maria', name: 'Maria', activeMinutes: 20, workoutDone: false, steps: 6400,  mobilityDone: false, notes: '' },
  { date: '2026-04-15', participantId: 'participant-maria', name: 'Maria', activeMinutes: 35, workoutDone: true,  steps: 9300,  mobilityDone: true,  notes: '' },
  { date: '2026-04-16', participantId: 'participant-maria', name: 'Maria', activeMinutes: 12, workoutDone: false, steps: 4900,  mobilityDone: false, notes: 'Rest' },
  { date: '2026-04-17', participantId: 'participant-maria', name: 'Maria', activeMinutes: 45, workoutDone: true,  steps: 10500, mobilityDone: true,  notes: 'Yoga flow' },
  // Week 1 (May 4–10) — Jay
  { date: '2026-05-04', participantId: 'participant-jay', name: 'Jay', activeMinutes: 52, workoutDone: true,  steps: 12400, mobilityDone: false, notes: 'Hill run' },
  { date: '2026-05-05', participantId: 'participant-jay', name: 'Jay', activeMinutes: 35, workoutDone: false, steps: 9200,  mobilityDone: true,  notes: '' },
  { date: '2026-05-06', participantId: 'participant-jay', name: 'Jay', activeMinutes: 61, workoutDone: true,  steps: 11000, mobilityDone: true,  notes: 'Long ride' },
  { date: '2026-05-07', participantId: 'participant-jay', name: 'Jay', activeMinutes: 20, workoutDone: false, steps: 6500,  mobilityDone: false, notes: '' },
  { date: '2026-05-08', participantId: 'participant-jay', name: 'Jay', activeMinutes: 45, workoutDone: true,  steps: 10200, mobilityDone: false, notes: 'Tempo run' },
  { date: '2026-05-09', participantId: 'participant-jay', name: 'Jay', activeMinutes: 12, workoutDone: false, steps: 4800,  mobilityDone: false, notes: 'Rest day' },
  { date: '2026-05-10', participantId: 'participant-jay', name: 'Jay', activeMinutes: 55, workoutDone: true,  steps: 13100, mobilityDone: true,  notes: '' },
  // Week 1 (May 4–10) — Maria
  { date: '2026-05-04', participantId: 'participant-maria', name: 'Maria', activeMinutes: 28, workoutDone: true,  steps: 8600,  mobilityDone: true,  notes: 'Walk + stretch' },
  { date: '2026-05-05', participantId: 'participant-maria', name: 'Maria', activeMinutes: 15, workoutDone: false, steps: 5800,  mobilityDone: false, notes: '' },
  { date: '2026-05-06', participantId: 'participant-maria', name: 'Maria', activeMinutes: 32, workoutDone: true,  steps: 9100,  mobilityDone: true,  notes: '' },
  { date: '2026-05-07', participantId: 'participant-maria', name: 'Maria', activeMinutes: 22, workoutDone: false, steps: 7200,  mobilityDone: false, notes: '' },
  { date: '2026-05-08', participantId: 'participant-maria', name: 'Maria', activeMinutes: 48, workoutDone: true,  steps: 10800, mobilityDone: true,  notes: 'Yoga + walk' },
  { date: '2026-05-09', participantId: 'participant-maria', name: 'Maria', activeMinutes: 19, workoutDone: false, steps: 6100,  mobilityDone: true,  notes: '' },
  { date: '2026-05-10', participantId: 'participant-maria', name: 'Maria', activeMinutes: 38, workoutDone: true,  steps: 9400,  mobilityDone: false, notes: '' },
];

function withComputedDailyPoints(entry) {
  return {
    ...entry,
    challengeWeek: getChallengeWeek(entry.date),
    dailyPoints: calculateDailyPoints(entry),
  };
}

function normalizeDateValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDailyLog(entry) {
  const normalizedDate = normalizeDateValue(entry?.date);
  const workoutDone =
    entry?.workoutDone === true || String(entry?.workoutDone || '').toLowerCase() === 'true';
  const mobilityDone =
    entry?.mobilityDone === true || String(entry?.mobilityDone || '').toLowerCase() === 'true';
  const activeMinutes = Number(entry?.activeMinutes || 0);
  const steps = Number(entry?.steps || 0);

  return {
    ...entry,
    date: normalizedDate,
    participantId: String(entry?.participantId || ''),
    name: String(entry?.name || ''),
    activeMinutes,
    workoutDone,
    steps,
    mobilityDone,
    notes: String(entry?.notes || ''),
    dailyPoints: Number(
      entry?.dailyPoints ??
      calculateDailyPoints({
        activeMinutes,
        workoutDone,
        steps,
        mobilityDone,
      })
    ),
    // Always recompute from date — legacy entries stored -1 (old sentinel) which now
    // collides with W-1 weekNumber. Recomputing ensures correct assignment.
    challengeWeek: getChallengeWeek(normalizedDate),
  };
}

function dedupeDailyLogs(entries) {
  const byKey = new Map();

  entries.forEach((entry) => {
    const normalized = normalizeDailyLog(entry);
    const key = `${normalized.participantId}::${normalized.date}`;
    byKey.set(key, normalized);
  });

  return [...byKey.values()];
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

function getStoredJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredJson(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function loadMockParticipants() {
  const stored = getStoredJson(MOCK_PARTICIPANTS_KEY, null);
  if (stored) return stored.map(normalizeParticipant);

  const seeded = mockParticipants.map(normalizeParticipant);
  setStoredJson(MOCK_PARTICIPANTS_KEY, seeded);
  return seeded;
}

function loadMockDailyLogs() {
  const stored = getStoredJson(MOCK_DAILY_LOGS_KEY, null);
  if (stored) return stored.map(withComputedDailyPoints);

  setStoredJson(MOCK_DAILY_LOGS_KEY, mockDailyLogs);
  return mockDailyLogs.map(withComputedDailyPoints);
}

export async function getParticipants() {
  if (!APP_SCRIPT_URL) {
    return { ok: true, data: loadMockParticipants(), source: 'mock' };
  }

  const response = await fetchJson(`${APP_SCRIPT_URL}?action=participants`);
  return {
    ...response,
    data: (response.data || []).map(normalizeParticipant),
  };
}

export async function addParticipant(payload) {
  if (!APP_SCRIPT_URL) {
    const participants = loadMockParticipants();
    const nextParticipant = normalizeParticipant({
      ...payload,
      id: payload.id || crypto.randomUUID?.() || `participant-${Date.now()}`,
    });
    setStoredJson(MOCK_PARTICIPANTS_KEY, [...participants, nextParticipant]);
    return { ok: true, data: nextParticipant, source: 'mock' };
  }
  return postJson({ action: 'addParticipant', ...payload });
}

export async function getLeaderboard() {
  if (!APP_SCRIPT_URL) {
    return {
      ok: true,
      data: buildLeaderboardRows(loadMockParticipants(), loadMockDailyLogs()),
      source: 'mock',
    };
  }
  return fetchJson(`${APP_SCRIPT_URL}?action=leaderboard`);
}

export async function getDailyLogs() {
  if (!APP_SCRIPT_URL) {
    return { ok: true, data: loadMockDailyLogs(), source: 'mock' };
  }
  const response = await fetchJson(`${APP_SCRIPT_URL}?action=dailyLogs`);
  return {
    ...response,
    data: dedupeDailyLogs(response.data || []),
  };
}

export async function getWeeklySummary() {
  if (!APP_SCRIPT_URL) {
    return {
      ok: true,
      data: buildWeeklySummaryRows(loadMockParticipants(), loadMockDailyLogs()),
      source: 'mock',
    };
  }
  return fetchJson(`${APP_SCRIPT_URL}?action=weeklySummary`);
}

export async function updateParticipant(payload) {
  if (!APP_SCRIPT_URL) {
    const participants = loadMockParticipants();
    const existing = participants.find((p) => p.id === payload.id);
    if (!existing) return { ok: false, error: 'Participant not found.' };
    const updated = normalizeParticipant({ ...existing, ...payload });
    setStoredJson(MOCK_PARTICIPANTS_KEY, participants.map((p) => (p.id === payload.id ? updated : p)));
    return { ok: true, data: updated, source: 'mock' };
  }
  return postJson({ action: 'updateParticipant', ...payload });
}

export async function verifyParticipantPin(participantId, pin) {
  if (!APP_SCRIPT_URL) {
    // Mock mode: auto-authenticate if participant has no pin set
    const participants = loadMockParticipants();
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return { ok: false, error: 'not_found' };
    const storedPin = String(participant.pin || '').trim();
    if (!storedPin) return { ok: true, source: 'mock' };
    if (storedPin === String(pin).trim()) return { ok: true, source: 'mock' };
    return { ok: false, error: 'invalid_pin', source: 'mock' };
  }
  return postJson({ action: 'verifyParticipantPin', participantId, pin });
}

export async function changeParticipantPin(participantId, newPin) {
  if (!APP_SCRIPT_URL) {
    const participants = loadMockParticipants();
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return { ok: false, error: 'not_found' };
    const updated = { ...participant, pin: newPin };
    setStoredJson(MOCK_PARTICIPANTS_KEY, participants.map((p) => (p.id === participantId ? updated : p)));
    return { ok: true, source: 'mock' };
  }
  return postJson({ action: 'changeParticipantPin', participantId, newPin });
}

export async function logDailyEntry(payload) {
  if (!APP_SCRIPT_URL) {
    const nextEntry = withComputedDailyPoints(payload);
    const logs = loadMockDailyLogs().filter(
      (entry) =>
        !(
          String(entry.participantId || '').trim() === String(payload.participantId || '').trim() &&
          entry.date === payload.date
        )
    );
    setStoredJson(MOCK_DAILY_LOGS_KEY, [...logs, payload]);

    return {
      ok: true,
      data: nextEntry,
      source: 'mock',
    };
  }
  return postJson({ action: 'logDailyEntry', ...payload });
}

export async function deleteLogEntry(participantId, date) {
  if (!APP_SCRIPT_URL) {
    const logs = loadMockDailyLogs().filter(
      (entry) =>
        !(
          String(entry.participantId || '').trim() === String(participantId || '').trim() &&
          entry.date === date
        )
    );
    setStoredJson(MOCK_DAILY_LOGS_KEY, logs);
    return { ok: true, source: 'mock' };
  }
  return postJson({ action: 'deleteLogEntry', participantId, date });
}
