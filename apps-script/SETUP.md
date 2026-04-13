# Google Apps Script Setup

## 1) Create spreadsheet
Create a Google Sheet and add two tabs:
- `Participants`
- `DailyLogs`

## 2) Set headers

### Participants
```text
UserId | Name | DeviceType | TeamName | BaselineActiveMinutes | BaselineSteps | Active | CreatedAt | ProfileImage | BaselineOverride | PhoneNumber | Pin | Role
```

`Active` uses `1` for active and `0` for inactive. Inactive participants stay in the sheet but are omitted from the normal participant roster returned by the API.
`Role` should usually be `participant`. Use `admin` only for admin-capable records.

### DailyLogs
```text
Date | ParticipantId | Name | ActiveMinutes | WorkoutDone | Steps | MobilityDone | Notes | DailyPoints | ChallengeWeek | CreatedAt
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

## 5) Run one-time PIN salt setup
Before using participant PIN features, run this once from the Apps Script editor:

```js
setPinSalt_()
```

This stores a secret salt in Apps Script `PropertiesService`. Participant PIN hashing and verification will fail until this is set.

Optional helper:

```js
generateParticipantPinHash('0000')
```

That logs the hash for a PIN if you ever need to seed or inspect participant PIN values manually.

## 6) Deploy
Deploy as a Web App:
- Execute as: Me
- Who has access: Anyone with the link, or your preferred setting

## 7) Add URL to frontend
In `.env.local`:
```bash
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

If you also deploy from GitHub Pages, set the production deployment URL in `.env.production`.

## 8) Test GET endpoints
Open these in a browser:
- `...?action=participants`
- `...?action=dailyLogs`
- `...?action=leaderboard`
- `...?action=weeklySummary`

## 9) Test POST actions
Use the frontend or Postman for:

- `addParticipant`
- `updateParticipant`
- `logDailyEntry`
- `verifyParticipantPin`
- `changeParticipantPin`
- `deleteLogEntry`

## Notes

- `Code.gs` will create or normalize headers automatically with `ensureHeaders_()`, but starting with the correct sheet columns is still recommended.
- PINs are never stored in plaintext by normal app flows; the backend hashes them before saving.
- The current backend supports participant PIN verification, but not yet a full admin session model or bulk admin seed/reset actions.
