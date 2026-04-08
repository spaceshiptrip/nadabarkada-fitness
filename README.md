# nadabarkada-fitness

Fitness Challenge Tracker

A React + Vite frontend with a Google Apps Script + Google Sheets backend for a month-long fitness challenge. The scoring model is designed to reward effort, consistency, and improvement rather than raw fitness alone.

## Fitness Challenge Rules

### Goal

Reward effort, consistency, and improvement, not just raw fitness.

Participants of all levels can compete fairly through daily activity and weekly progress relative to their own baseline.

### Challenge Structure

- Week 0 (Apr 27-May 3): Baseline tracking with no scoring
- Weeks 1-4 (May 4-June 4): Scoring period

Baseline is used to calculate weekly improvement bonuses.

### Daily Scoring

Maximum 10 points per day.

#### Activity Minutes

- 10-19 minutes = 1 point
- 20-29 minutes = 2 points
- 30-44 minutes = 3 points
- 45-59 minutes = 4 points
- 60+ minutes = 5 points

#### Steps

- 6,000+ = 1 point
- 8,000+ = 2 points
- 10,000+ = 3 points

#### Workout Bonus

- +2 points for a workout session of 20+ minutes
- Must be intentional: run, gym, class, sport, and similar activities
- Max 1 workout bonus per day

#### Mobility / Recovery

- +1 point for stretching, yoga, or mobility of 5+ minutes
- Max 1 per day

#### Daily Cap

- Maximum 10 points per day
- Encourages consistency over extreme efforts

### Weekly Bonuses

#### Active Days

- 3 days = +3
- 5 days = +6
- 6+ days = +8

Active day = 10+ activity minutes.

#### Improvement vs Baseline

Activity minutes increase:

- +10% = +3
- +20% = +5
- +30% = +7

Steps increase:

- +10% = +1
- +20% = +2

#### Best Week Bonus

- +2 points for beating your previous highest weekly score

### Teams

Teams are optional and meant to increase motivation and participation without replacing individual competition.

#### Individual Competition

- The main winner is based on total individual points

#### Team Competition

- Team score = average points per member
- A member must log at least 3 active days in a week to count toward team score
- Recommended optional adjustment: exclude the lowest scorer each week

#### Optional Team Bonuses

- +2 if all team members hit 3 active days
- +3 if team average improves versus the prior week

#### Solo Players

- Participants can compete without joining a team
- Solo players remain eligible for the main leaderboard

### Fair Play Rules

Definitions:

- Workout: 20+ minutes of intentional activity
- Mobility: 5+ minutes of recovery or stretching
- Active day: 10+ activity minutes

General rules:

- No double counting activities
- Max 1 workout bonus per day
- Activities should reflect real effort
- Honor system applies

Anti-gaming:

- No splitting one workout into multiple entries
- Steps and minutes should align with realistic movement
- Use device data or honest manual entry

### Scoring Philosophy

- Beginners can compete through consistency
- Advanced participants must improve beyond baseline
- Everyone has multiple ways to earn points daily

You do not need to be the fittest, just the most consistent.

### Winning

Individual winner:

- Highest total points across all scoring weeks

Optional team winner:

- Highest average team score

Tie-breakers:

1. Most active days
2. Highest percentage improvement
3. Longest consistency streak, if tracked

### Example Day

- 45 minute run = 4
- Workout bonus = +2
- 10,000 steps = +3
- Mobility = +1

Total = 10 points after the daily cap

## Project structure

```text
fitness-challenge-app/
|-- apps-script/
|-- docs/
|-- public/
|-- src/
|-- .env.example
|-- components.json
|-- index.html
|-- jsconfig.json
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
`-- vite.config.js
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

If you leave it blank, the UI loads in mock/demo mode.

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
