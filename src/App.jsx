import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Header from '@/components/Header';
import ChallengeOverview from '@/components/ChallengeOverview';
import RulesCard from '@/components/RulesCard';
import ParticipantManager from '@/components/ParticipantManager';
import DailyLogForm from '@/components/DailyLogForm';
import LeaderboardTable from '@/components/LeaderboardTable';
import WeeklySummaryCards from '@/components/WeeklySummaryCards';
import WeekRingsCalendar from '@/components/WeekRingsCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  addParticipant,
  getDailyLogs,
  getLeaderboard,
  getParticipants,
  getWeeklySummary,
  logDailyEntry,
} from '@/lib/api';
import { mergeParticipantsWithBaselines } from '@/lib/participants';

export default function App() {
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [participantsSource, setParticipantsSource] = useState('loading');
  const [leaderboardSource, setLeaderboardSource] = useState('loading');
  const [summarySource, setSummarySource] = useState('loading');
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [submittingLog, setSubmittingLog] = useState(false);
  const [message, setMessage] = useState('');
  const [showRules, setShowRules] = useState(true);

  async function loadAll() {
    try {
      const [participantsRes, leaderboardRes, summaryRes, logsRes] = await Promise.all([
        getParticipants(),
        getLeaderboard(),
        getWeeklySummary(),
        getDailyLogs(),
      ]);

      setParticipants(participantsRes.data || []);
      setLeaderboard(leaderboardRes.data || []);
      setWeeklySummary(summaryRes.data || []);
      setDailyLogs(logsRes.data || []);
      setParticipantsSource(participantsRes.source || 'live');
      setLeaderboardSource(leaderboardRes.source || 'live');
      setSummarySource(summaryRes.source || 'live');
    } catch (error) {
      setMessage(error.message || 'Failed to load data.');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const derivedParticipants = useMemo(
    () => mergeParticipantsWithBaselines(participants, dailyLogs),
    [participants, dailyLogs]
  );

  async function handleAddParticipant(payload) {
    try {
      setLoadingParticipants(true);
      setMessage('');
      await addParticipant(payload);
      await loadAll();
      setMessage(`Added participant: ${payload.name}`);
    } catch (error) {
      setMessage(error.message || 'Failed to add participant.');
    } finally {
      setLoadingParticipants(false);
    }
  }

  async function handleLogEntry(payload) {
    try {
      setSubmittingLog(true);
      setMessage('');
      const result = await logDailyEntry(payload);
      await loadAll();
      setMessage(
        `Saved log for ${payload.name} on ${payload.date}. Daily points: ${result?.data?.dailyPoints ?? 'computed on backend'}`
      );
    } catch (error) {
      setMessage(error.message || 'Failed to save daily log.');
    } finally {
      setSubmittingLog(false);
    }
  }

  return (
    <div className="app-shell">
      <Header />

      <div className="mb-6 rounded-2xl border bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">Rules at a glance</div>
            <div className="text-sm text-muted-foreground">
              Toggle the rules panel without losing the desktop side placement.
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowRules((current) => !current)}
            aria-expanded={showRules}
          >
            {showRules ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showRules ? 'Collapse rules' : 'Expand rules'}
          </Button>
        </div>
      </div>

      {showRules && (
        <div className="mb-6 xl:hidden">
          <RulesCard />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Challenge dashboard</h2>
          <p className="section-subtitle">
            Log activity, check standings, and review the challenge rules in one place.
          </p>
        </div>
        <Button variant="outline" onClick={loadAll}>
          Refresh data
        </Button>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border bg-white p-4 text-sm shadow-soft">
          {message}
        </div>
      )}

      <div className={`grid gap-6 ${showRules ? 'xl:grid-cols-[1.1fr,0.9fr]' : ''}`}>
        <div className="flex min-w-0 flex-col gap-6">
          <DailyLogForm participants={derivedParticipants} onSubmit={handleLogEntry} loading={submittingLog} />
          <ChallengeOverview />
          <WeekRingsCalendar logs={dailyLogs} participants={derivedParticipants} />
        </div>
        {showRules && (
          <div className="hidden xl:block">
            <RulesCard />
          </div>
        )}
      </div>

      <Tabs defaultValue="participants" className="mt-8">
        <TabsList>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="weekly">Weekly summaries</TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <ParticipantManager
            participants={derivedParticipants}
            onAddParticipant={handleAddParticipant}
            loading={loadingParticipants}
          />
          <div className="mt-4 text-sm text-muted-foreground">Data source: {participantsSource}</div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <LeaderboardTable rows={leaderboard} source={leaderboardSource} />
        </TabsContent>

        <TabsContent value="weekly">
          <WeeklySummaryCards rows={weeklySummary} source={summarySource} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
