const SPREADSHEET_ID = '1wqTMjXCBFA8PZg2L5Tg0WLZPAxO_TEantDIeNenRdZ4';
const PARTICIPANTS_SHEET = 'Participants';
const DAILY_LOGS_SHEET = 'DailyLogs';
const PARTICIPANT_HEADERS = ['UserId', 'Name', 'DeviceType', 'TeamName', 'BaselineActiveMinutes', 'BaselineSteps', 'Active', 'CreatedAt', 'ProfileImage', 'BaselineOverride', 'PhoneNumber', 'Pin'];
const DAILY_LOG_HEADERS = ['Date', 'ParticipantId', 'Name', 'ActiveMinutes', 'WorkoutDone', 'Steps', 'MobilityDone', 'Notes', 'DailyPoints', 'ChallengeWeek', 'CreatedAt'];

const BASELINE_START = new Date('2026-04-27T00:00:00');
const WEEK1_START = new Date('2026-05-04T00:00:00');
const CHALLENGE_END = new Date('2026-05-31T23:59:59');

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  try {
    if (action === 'participants') return json_({ ok: true, data: getParticipants_(), source: 'live' });
    if (action === 'dailyLogs') return json_({ ok: true, data: getDailyLogs_(), source: 'live' });
    if (action === 'leaderboard') return json_({ ok: true, data: getLeaderboard_(), source: 'live' });
    if (action === 'weeklySummary') return json_({ ok: true, data: getWeeklySummary_(), source: 'live' });

    return json_({
      ok: true,
      message: 'Fitness Challenge Tracker API',
      actions: ['participants', 'dailyLogs', 'leaderboard', 'weeklySummary'],
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

    if (action === 'updateParticipant') {
      const saved = updateParticipant_(payload);
      return json_({ ok: true, data: saved, source: 'live' });
    }

    return json_({ ok: false, error: 'Unknown action' });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function addParticipant_(payload) {
  const sheet = getSheet_(PARTICIPANTS_SHEET);
  ensureHeaders_(sheet, PARTICIPANT_HEADERS);
  const participants = getParticipantsRaw_();
  const normalizedName = normalizeName_(payload.name);

  if (!normalizedName) throw new Error('Participant name is required.');
  if (participants.some(function(participant) { return normalizeName_(participant.name) === normalizedName; })) {
    throw new Error('A participant with that name already exists. Frontend support for duplicate names needs participant IDs first.');
  }

  const userId = createUserId_();

  const row = [
    userId,
    payload.name || '',
    payload.deviceType || '',
    payload.teamName || '',
    number_(payload.baselineActiveMinutes),
    number_(payload.baselineSteps),
    normalizeActiveFlag_(payload.active),
    new Date(),
    payload.profileImage || '',
    toBool_(payload.baselineOverride),
    payload.phoneNumber || '',
    payload.pin || '',
  ];

  sheet.appendRow(row);

  return {
    id: userId,
    name: payload.name || '',
    deviceType: payload.deviceType || '',
    teamName: payload.teamName || '',
    baselineActiveMinutes: number_(payload.baselineActiveMinutes),
    baselineSteps: number_(payload.baselineSteps),
    profileImage: payload.profileImage || '',
    baselineOverride: toBool_(payload.baselineOverride),
    phoneNumber: payload.phoneNumber || '',
    active: payload.active !== false,
  };
}

function addDailyLog_(payload) {
  const sheet = getSheet_(DAILY_LOGS_SHEET);
  ensureHeaders_(sheet, DAILY_LOG_HEADERS);
  const participant = resolveParticipant_(payload);

  const entry = {
    date: payload.date || '',
    participantId: participant.id,
    name: participant.name,
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
    entry.participantId,
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

  upsertDailyLogRow_(sheet, entry.participantId, entry.date, row);

  return {
    date: entry.date,
    participantId: entry.participantId,
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
  return getParticipantsRaw_()
    .filter(function(participant) { return participant.active === 1; })
    .map(function(participant) {
    return {
      id: participant.id,
      name: participant.name,
      deviceType: participant.deviceType,
      teamName: participant.teamName,
      baselineActiveMinutes: participant.baselineActiveMinutes,
      baselineSteps: participant.baselineSteps,
      profileImage: participant.profileImage || '',
      baselineOverride: participant.baselineOverride,
      phoneNumber: participant.phoneNumber || '',
      active: participant.active,
    };
    });
}

function getDailyLogs_() {
  const sheet = getSheet_(DAILY_LOGS_SHEET);
  ensureHeaders_(sheet, DAILY_LOG_HEADERS);
  const rows = getObjects_(sheet);
  return rows
    .filter(function(row) { return String(row.Name || '').trim() !== ''; })
    .map(function(row) {
      return {
        date: formatDate_(row.Date),
        participantId: row.ParticipantId || '',
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
    const baseline = getParticipantBaseline_(participant, logs);
    const personLogs = logs.filter(function(log) {
      return matchesParticipant_(participant, log) && number_(log.challengeWeek) >= 1;
    });

    const dailyTotal = sum_(personLogs.map(function(log) { return number_(log.dailyPoints); }));
    const weeklyBonuses = calculateAllWeeklyBonusesForParticipant_(participant, logs);

    return {
      name: participant.name,
      deviceType: participant.deviceType,
      teamName: participant.teamName,
      baselineActiveMinutes: baseline.activeMinutes,
      baselineSteps: baseline.steps,
      profileImage: participant.profileImage || '',
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
  const scoringWeeks = getScoringWeekNumbers_();

  participants.forEach(function(participant) {
    const baseline = getParticipantBaseline_(participant, logs);
    const personLogs = logs.filter(function(log) { return matchesParticipant_(participant, log); });
    let priorBest = 0;

    scoringWeeks.forEach(function(week) {
      const weekLogs = personLogs.filter(function(log) { return number_(log.challengeWeek) === week; });
      if (!weekLogs.length) return;

      const dailyPointsTotal = sum_(weekLogs.map(function(log) { return number_(log.dailyPoints); }));
      const activeDays = weekLogs.filter(function(log) {
        return number_(log.activeMinutes) >= 10 || toBool_(log.workoutDone);
      }).length;

      const consistencyBonus = calculateConsistencyBonus_(activeDays);
      const avgActiveMinutes = average_(weekLogs.map(function(log) { return number_(log.activeMinutes); }));
      const avgSteps = average_(weekLogs.map(function(log) { return number_(log.steps); }));
      const activeMinutesBonus = calculateActiveMinutesImprovementBonus_(baseline.activeMinutes, avgActiveMinutes);
      const stepsBonus = calculateStepsImprovementBonus_(baseline.steps, avgSteps);
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
  const baseline = getParticipantBaseline_(participant, allLogs);
  const personLogs = allLogs.filter(function(log) { return matchesParticipant_(participant, log); });
  let totalBonuses = 0;
  let priorBest = 0;
  const scoringWeeks = getScoringWeekNumbers_();

  scoringWeeks.forEach(function(week) {
    const weekLogs = personLogs.filter(function(log) { return number_(log.challengeWeek) === week; });
    if (!weekLogs.length) return;

    const activeDays = weekLogs.filter(function(log) {
      return number_(log.activeMinutes) >= 10 || toBool_(log.workoutDone);
    }).length;

    const consistencyBonus = calculateConsistencyBonus_(activeDays);
    const avgActiveMinutes = average_(weekLogs.map(function(log) { return number_(log.activeMinutes); }));
    const avgSteps = average_(weekLogs.map(function(log) { return number_(log.steps); }));
    const activeMinutesBonus = calculateActiveMinutesImprovementBonus_(baseline.activeMinutes, avgActiveMinutes);
    const stepsBonus = calculateStepsImprovementBonus_(baseline.steps, avgSteps);

    const dailyPointsTotal = sum_(weekLogs.map(function(log) { return number_(log.dailyPoints); }));
    const subtotal = dailyPointsTotal + consistencyBonus + activeMinutesBonus + stepsBonus;
    const personalBestBonus = subtotal > priorBest ? 2 : 0;

    if (subtotal > priorBest) priorBest = subtotal;

    totalBonuses += consistencyBonus + activeMinutesBonus + stepsBonus + personalBestBonus;
  });

  return totalBonuses;
}

function getParticipantBaseline_(participant, logs) {
  if (toBool_(participant.baselineOverride)) {
    return {
      activeMinutes: number_(participant.baselineActiveMinutes),
      steps: number_(participant.baselineSteps),
    };
  }

  const baselineLogs = logs.filter(function(log) {
    return matchesParticipant_(participant, log) && number_(log.challengeWeek) === 0;
  });

  if (!baselineLogs.length) {
    return { activeMinutes: 0, steps: 0 };
  }

  return {
    activeMinutes: average_(baselineLogs.map(function(log) { return number_(log.activeMinutes); })),
    steps: average_(baselineLogs.map(function(log) { return number_(log.steps); })),
  };
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
  const msPerDay = 24 * 60 * 60 * 1000;

  if (date.getTime() < BASELINE_START.getTime()) return -1;
  if (date.getTime() > CHALLENGE_END.getTime()) return -1;
  if (date.getTime() < WEEK1_START.getTime()) return 0;

  const diffDays = Math.floor((date.getTime() - WEEK1_START.getTime()) / msPerDay);
  return Math.floor(diffDays / 7) + 1;
}

function getScoringWeekNumbers_() {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((CHALLENGE_END.getTime() - WEEK1_START.getTime()) / msPerDay);
  const totalWeeks = Math.floor(diffDays / 7) + 1;
  const weeks = [];

  for (var week = 1; week <= totalWeeks; week += 1) {
    weeks.push(week);
  }

  return weeks;
}

function getSheet_(name) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name);
  return sheet;
}

function getParticipantsRaw_() {
  const sheet = getSheet_(PARTICIPANTS_SHEET);
  ensureHeaders_(sheet, PARTICIPANT_HEADERS);
  const rows = getObjects_(sheet);

  return rows
    .filter(function(row) { return String(row.Name || '').trim() !== ''; })
    .map(function(row) {
      return {
        id: row.UserId || '',
        name: row.Name,
        deviceType: row.DeviceType,
        teamName: row.TeamName,
        baselineActiveMinutes: number_(row.BaselineActiveMinutes),
        baselineSteps: number_(row.BaselineSteps),
        profileImage: row.ProfileImage || '',
        baselineOverride: toBool_(row.BaselineOverride),
        phoneNumber: row.PhoneNumber || '',
        pin: row.Pin || '',
        active: normalizeActiveFlag_(row.Active),
      };
    });
}

function resolveParticipant_(payload) {
  const participants = getParticipantsRaw_();
  const participantId = String(payload.participantId || '').trim();
  const participantName = normalizeName_(payload.name);

  if (participantId) {
    const byId = participants.find(function(participant) { return String(participant.id) === participantId; });
    if (!byId) throw new Error('Participant not found for participantId: ' + participantId);
    return byId;
  }

  const byName = participants.filter(function(participant) {
    return normalizeName_(participant.name) === participantName;
  });

  if (!participantName) throw new Error('Participant name is required.');
  if (!byName.length) throw new Error('Participant not found: ' + payload.name);
  if (byName.length > 1) throw new Error('Multiple participants share that name. Submit participantId instead.');

  return byName[0];
}

function matchesParticipant_(participant, log) {
  const participantId = String(participant.id || '').trim();
  const logParticipantId = String(log.participantId || '').trim();
  if (participantId && logParticipantId) return participantId === logParticipantId;
  return normalizeName_(participant.name) === normalizeName_(log.name);
}

function upsertDailyLogRow_(sheet, participantId, date, rowValues) {
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) {
    sheet.appendRow(rowValues);
    return;
  }

  const headers = values[0];
  const participantIdIndex = headers.indexOf('ParticipantId');
  const dateIndex = headers.indexOf('Date');

  for (var i = 1; i < values.length; i += 1) {
    var existingParticipantId = String(values[i][participantIdIndex] || '').trim();
    var existingDate = formatDate_(values[i][dateIndex]);

    if (existingParticipantId === String(participantId).trim() && existingDate === String(date).trim()) {
      sheet.getRange(i + 1, 1, 1, rowValues.length).setValues([rowValues]);
      return;
    }
  }

  sheet.appendRow(rowValues);
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach(function(header, index) {
    if (existingHeaders[index] !== header) {
      sheet.getRange(1, index + 1).setValue(header);
    }
  });
}

function createUserId_() {
  return Utilities.getUuid();
}

function normalizeActiveFlag_(value) {
  if (value === 0 || value === '0') return 0;
  if (value === 1 || value === '1') return 1;

  var normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'false' || normalized === 'no' || normalized === 'inactive') return 0;
  if (normalized === 'true' || normalized === 'yes' || normalized === 'active') return 1;

  return 1;
}

function normalizeName_(value) {
  return String(value || '').trim().toLowerCase();
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

function formatDate_(value) {
  if (!value) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value).slice(0, 10);
}

function updateParticipant_(payload) {
  const sheet = getSheet_(PARTICIPANTS_SHEET);
  ensureHeaders_(sheet, PARTICIPANT_HEADERS);
  const participantId = String(payload.id || '').trim();
  if (!participantId) throw new Error('Participant id is required.');

  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) throw new Error('Participant not found.');

  const headers = values[0];
  const userIdIndex = headers.indexOf('UserId');

  for (var i = 1; i < values.length; i += 1) {
    if (String(values[i][userIdIndex] || '').trim() === participantId) {
      const row = values[i];
      const fieldMap = {
        Name: headers.indexOf('Name'),
        DeviceType: headers.indexOf('DeviceType'),
        TeamName: headers.indexOf('TeamName'),
        ProfileImage: headers.indexOf('ProfileImage'),
        BaselineOverride: headers.indexOf('BaselineOverride'),
        BaselineActiveMinutes: headers.indexOf('BaselineActiveMinutes'),
        BaselineSteps: headers.indexOf('BaselineSteps'),
      };

      if (payload.name !== undefined) row[fieldMap.Name] = payload.name;
      if (payload.deviceType !== undefined) row[fieldMap.DeviceType] = payload.deviceType;
      if (payload.teamName !== undefined) row[fieldMap.TeamName] = payload.teamName;
      if (payload.profileImage !== undefined) row[fieldMap.ProfileImage] = payload.profileImage;
      if (payload.baselineOverride !== undefined) row[fieldMap.BaselineOverride] = toBool_(payload.baselineOverride);
      if (payload.baselineActiveMinutes !== undefined) row[fieldMap.BaselineActiveMinutes] = number_(payload.baselineActiveMinutes);
      if (payload.baselineSteps !== undefined) row[fieldMap.BaselineSteps] = number_(payload.baselineSteps);

      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);

      return {
        id: participantId,
        name: row[fieldMap.Name],
        deviceType: row[fieldMap.DeviceType],
        teamName: row[fieldMap.TeamName],
        profileImage: row[fieldMap.ProfileImage] || '',
      };
    }
  }

  throw new Error('Participant not found: ' + participantId);
}
