import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Header from '@/components/Header';
import RulesCard from '@/components/RulesCard';
import ParticipantManager from '@/components/ParticipantManager';
import DailyLogForm from '@/components/DailyLogForm';
import LeaderboardTable from '@/components/LeaderboardTable';
import MyRingsPanel from '@/components/MyRingsPanel';
import WeekRingsCalendar from '@/components/WeekRingsCalendar';
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
  const [showRules, setShowRules] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [confirmedParticipantId, setConfirmedParticipantId] = useState('');

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

  useEffect(() => {
    if (!derivedParticipants.length) {
      setSelectedParticipantId('');
      setConfirmedParticipantId('');
      return;
    }
    const hasSelectedParticipant = derivedParticipants.some((participant) => participant.id === selectedParticipantId);
    const hasConfirmedParticipant = derivedParticipants.some((participant) => participant.id === confirmedParticipantId);

    if (selectedParticipantId && !hasSelectedParticipant) {
      setSelectedParticipantId('');
    }

    if (confirmedParticipantId && !hasConfirmedParticipant) {
      setConfirmedParticipantId('');
    }
  }, [derivedParticipants, selectedParticipantId, confirmedParticipantId]);

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
      if (result?.ok && payload.participantId) {
        setConfirmedParticipantId(payload.participantId);
      }
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
            <div className="text-sm font-semibold text-slate-800">Rules and Timeline</div>
            <div className="text-sm text-muted-foreground">
              Toggle the rules and challenge timeline panel.
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
        <div className="mb-6">
          <RulesCard />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Challenge dashboard</h2>
          <p className="section-subtitle">
            Log activity, check weekly progress, and review standings in one place.
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

      <div className="mb-8 space-y-8">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="min-w-0">
            <DailyLogForm
              participants={derivedParticipants}
              onSubmit={handleLogEntry}
              loading={submittingLog}
              selectedParticipantId={selectedParticipantId}
              onSelectedParticipantChange={setSelectedParticipantId}
              confirmedParticipantId={confirmedParticipantId}
            />
          </div>
          <div className="min-w-0">
              <MyRingsPanel
                participants={derivedParticipants}
                logs={dailyLogs}
                selectedParticipantId={selectedParticipantId}
              />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="min-w-0">
            <WeekRingsCalendar
              logs={dailyLogs}
              participants={derivedParticipants}
              title="Weekly Leaderboard Rings"
            />
          </div>
          <div className="min-w-0">
            <LeaderboardTable
              rows={leaderboard}
              source={leaderboardSource}
              title="Challenge leaderboard"
              description="Ranked by total challenge points."
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="section-title">Admin panels</h2>
        <p className="section-subtitle">
          Manage participants, baseline overrides, and profile photos.
        </p>
      </div>

      <ParticipantManager
        participants={derivedParticipants}
        onAddParticipant={handleAddParticipant}
        loading={loadingParticipants}
      />
      <div className="mt-4 text-sm text-muted-foreground">Data source: {participantsSource}</div>
    </div>
  );
}
