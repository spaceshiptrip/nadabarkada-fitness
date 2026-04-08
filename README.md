# nadabarkada-fitness

Fitness Challenge Tracker

A full-stack starter app for a **4-week fitness challenge** with a **baseline week** using:

- **React + Vite**
- **Tailwind CSS**
- **shadcn/ui-style components**
- **Google Apps Script**
- **Google Sheets** for persistence

This scaffold is designed for a mixed-fitness group where some people already train regularly and others are more sedentary. The scoring system rewards **effort, consistency, and improvement relative to a personal baseline**.

## Challenge schedule

- **Baseline Week (Week 0):** April 27, 2026 – May 3, 2026
- **Week 1 starts:** May 4, 2026
- **Challenge ends:** June 4, 2026

Suggested competition window:
- **Week 1:** May 4 – May 10
- **Week 2:** May 11 – May 17
- **Week 3:** May 18 – May 24
- **Week 4:** May 25 – May 31
- **Final days / wrap-up:** June 1 – June 4

## Point system

This app uses a fair points model so highly trained people do not automatically dominate.

### Daily points

#### 1) Active minutes
- 0–9 min = 0 points
- 10–19 min = 1 point
- 20–29 min = 2 points
- 30–44 min = 3 points
- 45–59 min = 4 points
- 60+ min = 5 points

#### 2) Workout completed
- Intentional workout session completed = **2 points**

Examples:
- brisk walk
- run
- cycling
- gym
- yoga
- pickleball
- hiking
- mobility session if treated as intentional exercise

#### 3) Steps
- 0–5,999 = 0 points
- 6,000–7,999 = 1 point
- 8,000–9,999 = 2 points
- 10,000+ = 3 points

#### 4) Bonus habit
- 10+ minutes mobility/stretching = **1 point**

#### 5) Daily cap
- **Maximum daily score = 10 points**

This prevents one massive day from overpowering the challenge.

---

### Weekly bonuses

#### A) Consistency bonus
An active day is a day with either:
- 20+ active minutes, or
- a recorded workout

Bonuses:
- 3 active days = 3 points
- 5 active days = 6 points
- 6+ active days = 8 points

#### B) Improvement vs baseline
Each participant’s baseline is their **Week 0 average**.

##### Active minutes improvement
- +10% over baseline = 3 points
- +20% over baseline = 5 points
- +30% over baseline = 7 points

##### Steps improvement
- +10% over baseline = 2 points
- +20% over baseline = 4 points

#### C) Personal best week bonus
- Best challenge week so far = 2 points

## Why this is fair

- Advanced athletes cannot win solely by volume because of the daily cap.
- Beginners can compete through consistency and improvement.
- Steps and mobility create multiple ways to score.
- Weekly bonuses are based on each person’s own starting point.

## Project structure

```text
fitness-challenge-app/
├── apps-script/
│   ├── Code.gs
│   ├── appsscript.json
│   └── SETUP.md
├── docs/
│   ├── challenge-rules.md
│   ├── deployment-guide.md
│   └── sheets-schema.md
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── table.jsx
│   │   │   └── tabs.jsx
│   │   ├── ChallengeOverview.jsx
│   │   ├── DailyLogForm.jsx
│   │   ├── Header.jsx
│   │   ├── LeaderboardTable.jsx
│   │   ├── ParticipantManager.jsx
│   │   ├── RulesCard.jsx
│   │   └── WeeklySummaryCards.jsx
│   ├── lib/
│   │   ├── api.js
│   │   ├── points.js
│   │   └── utils.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── components.json
├── index.html
├── jsconfig.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Frontend features

- Add and manage participants
- Capture daily activity logs
- Automatically compute daily points
- Pull leaderboard and weekly summaries from Google Apps Script
- Show challenge schedule and scoring rules
- Includes a sample mock mode for local UI testing

## Backend features

The included Google Apps Script:
- stores participants in a Google Sheet tab
- stores daily logs in a Google Sheet tab
- computes leaderboard and weekly rollups
- exposes JSON endpoints via `doGet` and `doPost`

## Local setup

### 1) Install dependencies
```bash
npm install
```

### 2) Start dev server
```bash
npm run dev
```

### 3) Build
```bash
npm run build
```

## Environment

Create `.env.local`:

```bash
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT/exec
```

If you leave it blank, the UI can still load in mock/demo mode.

## Google Apps Script setup

See:
- `apps-script/SETUP.md`
- `docs/deployment-guide.md`
- `docs/sheets-schema.md`

High level:
1. Create a Google Sheet.
2. Add tabs:
   - `Participants`
   - `DailyLogs`
3. Copy `apps-script/Code.gs` and `apps-script/appsscript.json` into Apps Script.
4. Set the spreadsheet ID in `Code.gs`.
5. Deploy as a web app.
6. Put the deployment URL into `VITE_APP_SCRIPT_URL`.

## Suggested Google Sheet tabs

### Participants
| Name | DeviceType | TeamName | BaselineActiveMinutes | BaselineSteps | Active | CreatedAt |

### DailyLogs
| Date | Name | ActiveMinutes | WorkoutDone | Steps | MobilityDone | Notes | DailyPoints | ChallengeWeek | CreatedAt |

## Notes

- This scaffold is intentionally simple so you can test locally fast.
- Authentication is not included yet.
- Honor system is assumed unless you later add screenshot verification or wearable integrations.
- The frontend is structured so you can add admin screens, teams, or charts later.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Next additions you could make

- team scoring
- Apple Health / Garmin import flow
- streak tracking
- charts
- admin-only rules editing
- QR code check-in / mobile log entry
