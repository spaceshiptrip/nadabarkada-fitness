const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
const PARTICIPANTS_SHEET = 'Participants';
const DAILY_LOGS_SHEET = 'DailyLogs';

const BASELINE_START = new Date('2026-04-27T00:00:00');
const WEEK1_START = new Date('2026-05-04T00:00:00');
const CHALLENGE_END = new Date('2026-06-04T23:59:59');

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  try {
    if (action === 'participants') return json_({ ok: true, data: getParticipants_(), source: 'live' });
    if (action === 'leaderboard') return json_({ ok: true, data: getLeaderboard_(), source: 'live' });
    if (action === 'weeklySummary') return json_({ ok: true, data: getWeeklySummary_(), source: 'live' });

    return json_({
      ok: true,
      message: 'Fitness Challenge Tracker API',
      actions: ['participants', 'leaderboard', 'weeklySummary'],
    });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = payload.action || '';

    if (action === 'addParticipant') {
      const saved = addParticipant_(payload);
      return json_({ ok: true, data: saved, source: 'live' });
    }

    if (action === 'logDailyEntry') {
      const saved = addDailyLog_(payload);
      return json_({ ok: true, data: saved, source: 'live' });
    }

    return json_({ ok: false, error: 'Unknown action' });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function addParticipant_(payload) {
  const sheet = getSheet_(PARTICIPANTS_SHEET);
  ensureHeaders_(sheet, ['Name', 'DeviceType', 'TeamName', 'BaselineActiveMinutes', 'BaselineSteps', 'Active', 'CreatedAt']);

  const row = [
    payload.name || '',
    payload.deviceType || '',
    payload.teamName || '',
    number_(payload.baselineActiveMinutes),
    number_(payload.baselineSteps),
    payload.active !== false,
    new Date(),
  ];

  sheet.appendRow(row);

  return {
    name: payload.name || '',
    deviceType: payload.deviceType || '',
    teamName: payload.teamName || '',
    baselineActiveMinutes: number_(payload.baselineActiveMinutes),
    baselineSteps: number_(payload.baselineSteps),
    active: payload.active !== false,
  };
}

function addDailyLog_(payload) {
  const sheet = getSheet_(DAILY_LOGS_SHEET);
  ensureHeaders_(sheet, ['Date', 'Name', 'ActiveMinutes', 'WorkoutDone', 'Steps', 'MobilityDone', 'Notes', 'DailyPoints', 'ChallengeWeek', 'CreatedAt']);

  const entry = {
    date: payload.date || '',
    name: payload.name || '',
    activeMinutes: number_(payload.activeMinutes),
    workoutDone: toBool_(payload.workoutDone),
    steps: number_(payload.steps),
    mobilityDone: toBool_(payload.mobilityDone),
    notes: payload.notes || '',
  };

  const dailyPoints = calculateDailyPoints_(entry);
  const challengeWeek = getChallengeWeek_(entry.date);

  const row = [
    entry.date,
    entry.name,
    entry.activeMinutes,
    entry.workoutDone,
    entry.steps,
    entry.mobilityDone,
    entry.notes,
    dailyPoints,
    challengeWeek,
    new Date(),
  ];

  sheet.appendRow(row);

  return {
    date: entry.date,
    name: entry.name,
    activeMinutes: entry.activeMinutes,
    workoutDone: entry.workoutDone,
    steps: entry.steps,
    mobilityDone: entry.mobilityDone,
    notes: entry.notes,
    dailyPoints: dailyPoints,
    challengeWeek: challengeWeek,
  };
}

function getParticipants_() {
  const sheet = getSheet_(PARTICIPANTS_SHEET);
  const rows = getObjects_(sheet);
  return rows
    .filter(function(row) { return String(row.Name || '').trim() !== ''; })
    .map(function(row) {
      return {
        name: row.Name,
        deviceType: row.DeviceType,
        teamName: row.TeamName,
        baselineActiveMinutes: number_(row.BaselineActiveMinutes),
        baselineSteps: number_(row.BaselineSteps),
        active: String(row.Active).toLowerCase() !== 'false',
      };
    });
}

function getDailyLogs_() {
  const sheet = getSheet_(DAILY_LOGS_SHEET);
  const rows = getObjects_(sheet);
  return rows
    .filter(function(row) { return String(row.Name || '').trim() !== ''; })
    .map(function(row) {
      return {
        date: row.Date,
        name: row.Name,
        activeMinutes: number_(row.ActiveMinutes),
        workoutDone: toBool_(row.WorkoutDone),
        steps: number_(row.Steps),
        mobilityDone: toBool_(row.MobilityDone),
        notes: row.Notes || '',
        dailyPoints: number_(row.DailyPoints),
        challengeWeek: number_(row.ChallengeWeek),
      };
    });
}

function getLeaderboard_() {
  const participants = getParticipants_();
  const logs = getDailyLogs_();

  return participants.map(function(participant) {
    const personLogs = logs.filter(function(log) {
      return log.name === participant.name && number_(log.challengeWeek) >= 1;
    });

    const dailyTotal = sum_(personLogs.map(function(log) { return number_(log.dailyPoints); }));
    const weeklyBonuses = calculateAllWeeklyBonusesForParticipant_(participant, logs);

    return {
      name: participant.name,
      deviceType: participant.deviceType,
      teamName: participant.teamName,
      baselineActiveMinutes: participant.baselineActiveMinutes,
      baselineSteps: participant.baselineSteps,
      totalPoints: dailyTotal + weeklyBonuses,
    };
  }).sort(function(a, b) {
    return b.totalPoints - a.totalPoints;
  });
}

function getWeeklySummary_() {
  const participants = getParticipants_();
  const logs = getDailyLogs_();
  const results = [];

  participants.forEach(function(participant) {
    const personLogs = logs.filter(function(log) { return log.name === participant.name; });
    let priorBest = 0;

    [1, 2, 3, 4].forEach(function(week) {
      const weekLogs = personLogs.filter(function(log) { return number_(log.challengeWeek) === week; });
      if (!weekLogs.length) return;

      const dailyPointsTotal = sum_(weekLogs.map(function(log) { return number_(log.dailyPoints); }));
      const activeDays = weekLogs.filter(function(log) {
        return number_(log.activeMinutes) >= 10 || toBool_(log.workoutDone);
      }).length;

      const consistencyBonus = calculateConsistencyBonus_(activeDays);
      const avgActiveMinutes = average_(weekLogs.map(function(log) { return number_(log.activeMinutes); }));
      const avgSteps = average_(weekLogs.map(function(log) { return number_(log.steps); }));
      const activeMinutesBonus = calculateActiveMinutesImprovementBonus_(participant.baselineActiveMinutes, avgActiveMinutes);
      const stepsBonus = calculateStepsImprovementBonus_(participant.baselineSteps, avgSteps);
      const improvementBonus = activeMinutesBonus + stepsBonus;

      let personalBestBonus = 0;
      const subtotal = dailyPointsTotal + consistencyBonus + improvementBonus;
      if (subtotal > priorBest) {
        personalBestBonus = 2;
        priorBest = subtotal;
      }

      results.push({
        name: participant.name,
        week: week,
        dailyPointsTotal: dailyPointsTotal,
        consistencyBonus: consistencyBonus,
        improvementBonus: improvementBonus,
        personalBestBonus: personalBestBonus,
        weeklyTotal: subtotal + personalBestBonus,
      });
    });
  });

  return results.sort(function(a, b) {
    if (a.week === b.week) return b.weeklyTotal - a.weeklyTotal;
    return a.week - b.week;
  });
}

function calculateAllWeeklyBonusesForParticipant_(participant, allLogs) {
  const personLogs = allLogs.filter(function(log) { return log.name === participant.name; });
  let totalBonuses = 0;
  let priorBest = 0;

  [1, 2, 3, 4].forEach(function(week) {
    const weekLogs = personLogs.filter(function(log) { return number_(log.challengeWeek) === week; });
    if (!weekLogs.length) return;

    const activeDays = weekLogs.filter(function(log) {
      return number_(log.activeMinutes) >= 10 || toBool_(log.workoutDone);
    }).length;

    const consistencyBonus = calculateConsistencyBonus_(activeDays);
    const avgActiveMinutes = average_(weekLogs.map(function(log) { return number_(log.activeMinutes); }));
    const avgSteps = average_(weekLogs.map(function(log) { return number_(log.steps); }));
    const activeMinutesBonus = calculateActiveMinutesImprovementBonus_(participant.baselineActiveMinutes, avgActiveMinutes);
    const stepsBonus = calculateStepsImprovementBonus_(participant.baselineSteps, avgSteps);

    const dailyPointsTotal = sum_(weekLogs.map(function(log) { return number_(log.dailyPoints); }));
    const subtotal = dailyPointsTotal + consistencyBonus + activeMinutesBonus + stepsBonus;
    const personalBestBonus = subtotal > priorBest ? 2 : 0;

    if (subtotal > priorBest) priorBest = subtotal;

    totalBonuses += consistencyBonus + activeMinutesBonus + stepsBonus + personalBestBonus;
  });

  return totalBonuses;
}

function calculateDailyPoints_(entry) {
  const total =
    calculateActivityPoints_(entry.activeMinutes) +
    (toBool_(entry.workoutDone) ? 2 : 0) +
    calculateStepsPoints_(entry.steps) +
    (toBool_(entry.mobilityDone) ? 1 : 0);

  return Math.min(total, 10);
}

function calculateActivityPoints_(minutes) {
  const value = number_(minutes);
  if (value >= 60) return 5;
  if (value >= 45) return 4;
  if (value >= 30) return 3;
  if (value >= 20) return 2;
  if (value >= 10) return 1;
  return 0;
}

function calculateStepsPoints_(steps) {
  const value = number_(steps);
  if (value >= 10000) return 3;
  if (value >= 8000) return 2;
  if (value >= 6000) return 1;
  return 0;
}

function calculateConsistencyBonus_(activeDays) {
  const value = number_(activeDays);
  if (value >= 6) return 8;
  if (value >= 5) return 6;
  if (value >= 3) return 3;
  return 0;
}

function calculateActiveMinutesImprovementBonus_(baselineAverage, weeklyAverage) {
  const baseline = number_(baselineAverage);
  const weekly = number_(weeklyAverage);
  if (baseline <= 0) return 0;

  const increase = (weekly - baseline) / baseline;
  if (increase >= 0.3) return 7;
  if (increase >= 0.2) return 5;
  if (increase >= 0.1) return 3;
  return 0;
}

function calculateStepsImprovementBonus_(baselineAverage, weeklyAverage) {
  const baseline = number_(baselineAverage);
  const weekly = number_(weeklyAverage);
  if (baseline <= 0) return 0;

  const increase = (weekly - baseline) / baseline;
  if (increase >= 0.2) return 2;
  if (increase >= 0.1) return 1;
  return 0;
}

function getChallengeWeek_(dateString) {
  if (!dateString) return -1;
  const date = new Date(String(dateString) + 'T12:00:00');
  const diffDays = Math.floor((date.getTime() - BASELINE_START.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return -1;
  if (diffDays <= 6) return 0;
  return Math.min(Math.floor((diffDays - 7) / 7) + 1, 4);
}

function getSheet_(name) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name);
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}

function getObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function number_(value) {
  const num = Number(value);
  return isFinite(num) ? num : 0;
}

function toBool_(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function sum_(values) {
  return values.reduce(function(sum, value) { return sum + number_(value); }, 0);
}

function average_(values) {
  if (!values || !values.length) return 0;
  return sum_(values) / values.length;
}
