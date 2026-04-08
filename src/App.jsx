import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ChallengeOverview from '@/components/ChallengeOverview';
import RulesCard from '@/components/RulesCard';
import ParticipantManager from '@/components/ParticipantManager';
import DailyLogForm from '@/components/DailyLogForm';
import LeaderboardTable from '@/components/LeaderboardTable';
import WeeklySummaryCards from '@/components/WeeklySummaryCards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  addParticipant,
  getLeaderboard,
  getParticipants,
  getWeeklySummary,
  logDailyEntry,
} from '@/lib/api';

export default function App() {
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [participantsSource, setParticipantsSource] = useState('loading');
  const [leaderboardSource, setLeaderboardSource] = useState('loading');
  const [summarySource, setSummarySource] = useState('loading');
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [submittingLog, setSubmittingLog] = useState(false);
  const [message, setMessage] = useState('');

  async function loadAll() {
    try {
      const [participantsRes, leaderboardRes, summaryRes] = await Promise.all([
        getParticipants(),
        getLeaderboard(),
        getWeeklySummary(),
      ]);

      setParticipants(participantsRes.data || []);
      setLeaderboard(leaderboardRes.data || []);
      setWeeklySummary(summaryRes.data || []);
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Challenge admin dashboard</h2>
          <p className="section-subtitle">
            Use mock mode locally or connect to Google Apps Script for real persistence.
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <ChallengeOverview />
        <RulesCard />
      </div>

      <Tabs defaultValue="log" className="mt-8">
        <TabsList>
          <TabsTrigger value="log">Daily log</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="weekly">Weekly summaries</TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <DailyLogForm participants={participants} onSubmit={handleLogEntry} loading={submittingLog} />
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantManager
            participants={participants}
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
