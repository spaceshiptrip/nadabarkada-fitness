# Google Apps Script Setup

## 1) Create spreadsheet
Create a Google Sheet and add two tabs:
- `Participants`
- `DailyLogs`

## 2) Set headers

### Participants
```text
Name | DeviceType | TeamName | BaselineActiveMinutes | BaselineSteps | Active | CreatedAt
```

### DailyLogs
```text
Date | Name | ActiveMinutes | WorkoutDone | Steps | MobilityDone | Notes | DailyPoints | ChallengeWeek | CreatedAt
```

## 3) Paste backend code
In Apps Script:
- replace the default code with `Code.gs`
- update `appsscript.json`

## 4) Update spreadsheet ID
Set:
```js
const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
```

## 5) Deploy
Deploy as a Web App:
- Execute as: Me
- Who has access: Anyone with the link, or your preferred setting

## 6) Add URL to frontend
In `.env.local`:
```bash
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## 7) Test GET endpoints
Open these in a browser:
- `...?action=participants`
- `...?action=leaderboard`
- `...?action=weeklySummary`

## 8) Test POST
Use the frontend or Postman.
