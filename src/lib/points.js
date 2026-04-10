import { CHALLENGE_CONFIG } from '@/lib/config';

export const SCHEDULE = {
  baselineStart: CHALLENGE_CONFIG.baselineStartDate,
  week1Start: CHALLENGE_CONFIG.challengeStartDate,
  endDate: CHALLENGE_CONFIG.challengeEndDate,
};

export function calculateActivityPoints(activeMinutes) {
  const minutes = Number(activeMinutes) || 0;
  if (minutes >= 60) return 5;
  if (minutes >= 45) return 4;
  if (minutes >= 30) return 3;
  if (minutes >= 20) return 2;
  if (minutes >= 10) return 1;
  return 0;
}

export function calculateWorkoutPoints(workoutDone) {
  return workoutDone ? 2 : 0;
}

export function calculateStepsPoints(steps) {
  const total = Number(steps) || 0;
  if (total >= 10000) return 3;
  if (total >= 8000) return 2;
  if (total >= 6000) return 1;
  return 0;
}

export function calculateMobilityPoints(mobilityDone) {
  return mobilityDone ? 1 : 0;
}

export function calculateDailyPoints({
  activeMinutes = 0,
  workoutDone = false,
  steps = 0,
  mobilityDone = false,
}) {
  const total =
    calculateActivityPoints(activeMinutes) +
    calculateWorkoutPoints(workoutDone) +
    calculateStepsPoints(steps) +
    calculateMobilityPoints(mobilityDone);

  return Math.min(total, 10);
}

export function isActiveDay({ activeMinutes = 0, workoutDone = false }) {
  return Number(activeMinutes) >= 10 || Boolean(workoutDone);
}

export function calculateConsistencyBonus(activeDays) {
  if (activeDays >= 6) return 8;
  if (activeDays >= 5) return 6;
  if (activeDays >= 3) return 3;
  return 0;
}

export function calculateActiveMinutesImprovementBonus(baselineAverage, weeklyAverage) {
  if (!baselineAverage || baselineAverage <= 0) return 0;
  const increase = (weeklyAverage - baselineAverage) / baselineAverage;
  if (increase >= 0.3) return 7;
  if (increase >= 0.2) return 5;
  if (increase >= 0.1) return 3;
  return 0;
}

export function calculateStepsImprovementBonus(baselineAverage, weeklyAverage) {
  if (!baselineAverage || baselineAverage <= 0) return 0;
  const increase = (weeklyAverage - baselineAverage) / baselineAverage;
  if (increase >= 0.2) return 2;
  if (increase >= 0.1) return 1;
  return 0;
}

export function getChallengeWeek(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  const baselineStart = new Date(`${SCHEDULE.baselineStart}T12:00:00`);
  const week1Start = new Date(`${SCHEDULE.week1Start}T12:00:00`);
  const endDate = new Date(`${SCHEDULE.endDate}T23:59:59`);
  const msPerDay = 24 * 60 * 60 * 1000;
  const baselineDiffDays = Math.floor((date - baselineStart) / msPerDay);

  if (baselineDiffDays < 0) return -1;
  if (date > endDate) return -1;
  if (date < week1Start) return 0;

  const scoringDiffDays = Math.floor((date - week1Start) / msPerDay);
  return Math.floor(scoringDiffDays / 7) + 1;
}

export function getWeeklyDateRanges() {
  const ranges = [];
  const baselineStart = new Date(`${SCHEDULE.baselineStart}T12:00:00`);
  const week1Start = new Date(`${SCHEDULE.week1Start}T12:00:00`);
  const endDate = new Date(`${SCHEDULE.endDate}T12:00:00`);

  ranges.push({
    label: 'Week 0 (Baseline)',
    start: toIsoDate(baselineStart),
    end: toIsoDate(addDaysToDate(baselineStart, 6)),
  });

  let weekIndex = 1;
  let cursor = new Date(week1Start);
  while (cursor <= endDate) {
    const weekEnd = addDaysToDate(cursor, 6);
    ranges.push({
      label: `Week ${weekIndex}`,
      start: toIsoDate(cursor),
      end: toIsoDate(weekEnd <= endDate ? weekEnd : endDate),
    });
    cursor = addDaysToDate(cursor, 7);
    weekIndex += 1;
  }

  return ranges;
}

export function getScoringWeekNumbers() {
  return getWeeklyDateRanges()
    .map((range, index) => (index === 0 ? null : index))
    .filter((week) => week !== null);
}

export function formatScheduleDate(dateString, options = {}) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatScheduleDateShort(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function addDaysToDate(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}
