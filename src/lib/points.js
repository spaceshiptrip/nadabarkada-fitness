export const SCHEDULE = {
  baselineStart: '2026-04-27',
  week1Start: '2026-05-04',
  endDate: '2026-06-04',
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
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((date - baselineStart) / msPerDay);

  if (diffDays < 0) return -1;
  if (diffDays <= 6) return 0;
  return Math.min(Math.floor((diffDays - 7) / 7) + 1, 4);
}

export function getWeeklyDateRanges() {
  return [
    { label: 'Week 0 (Baseline)', start: '2026-04-27', end: '2026-05-03' },
    { label: 'Week 1', start: '2026-05-04', end: '2026-05-10' },
    { label: 'Week 2', start: '2026-05-11', end: '2026-05-17' },
    { label: 'Week 3', start: '2026-05-18', end: '2026-05-24' },
    { label: 'Week 4', start: '2026-05-25', end: '2026-06-04' },
  ];
}
