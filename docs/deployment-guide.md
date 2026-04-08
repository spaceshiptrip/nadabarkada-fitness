# Deployment Guide

## Frontend
1. Install Node.js 20+.
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. Create `.env.local`:
   ```bash
   VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

## Google Apps Script backend

### Create spreadsheet
Create a Google Sheet and add these tabs:
- `Participants`
- `DailyLogs`

### Copy backend code
Create a new Apps Script project and paste in:
- `apps-script/Code.gs`
- `apps-script/appsscript.json`

### Update spreadsheet ID
Inside `Code.gs`, replace:
```js
const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
```

### Deploy
1. Click **Deploy** → **New deployment**
2. Choose **Web app**
3. Execute as **Me**
4. Access:
   - Anyone with link, or
   - your preferred access mode
5. Copy the deployment URL

### Connect frontend
Put the deployment URL in `.env.local`:
```bash
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## API endpoints
### GET
- `?action=participants`
- `?action=leaderboard`
- `?action=weeklySummary`

### POST
- `action=addParticipant`
- `action=logDailyEntry`

## Testing strategy
- start with local mock mode
- verify participant creation
- verify daily log entry
- verify Google Sheet row creation
- verify leaderboard scoring matches expected calculations
