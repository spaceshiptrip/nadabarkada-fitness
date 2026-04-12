import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
import Header from '@/components/Header';
import RulesCard from '@/components/RulesCard';
import ProfilePanel from '@/components/ProfilePanel';
import DailyLogForm from '@/components/DailyLogForm';
import LeaderboardTable from '@/components/LeaderboardTable';
import MyRingsPanel from '@/components/MyRingsPanel';
import WeekRingsCalendar from '@/components/WeekRingsCalendar';
import { Button } from '@/components/ui/button';
import {
  getDailyLogs,
  getLeaderboard,
  getParticipants,
  getWeeklySummary,
  logDailyEntry,
  updateParticipant,
  verifyParticipantPin,
} from '@/lib/api';
import { DEFAULT_PROFILE_IMAGE, getParticipantProfileImage, mergeParticipantsWithBaselines } from '@/lib/participants';
import { ADMIN_PHONE_E164, ADMIN_SMS_BODY } from '@/lib/config';

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
  const [showProfile, setShowProfile] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [confirmedParticipantId, setConfirmedParticipantId] = useState('');
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showParticipantMenu, setShowParticipantMenu] = useState(false);
  const [authenticatedParticipantId, setAuthenticatedParticipantId] = useState('');

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
  const selectedParticipant = useMemo(
    () => derivedParticipants.find((participant) => participant.id === selectedParticipantId) || null,
    [derivedParticipants, selectedParticipantId]
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

  async function handleUpdateParticipant(payload) {
    try {
      setLoadingParticipants(true);
      setMessage('');
      await updateParticipant(payload);
      await loadAll();
    } catch (error) {
      setMessage(error.message || 'Failed to update profile.');
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

  function handleParticipantSelection(nextParticipantId) {
    setSelectedParticipantId(nextParticipantId);
    if (nextParticipantId !== confirmedParticipantId) {
      setConfirmedParticipantId('');
    }
    if (nextParticipantId !== authenticatedParticipantId) {
      setAuthenticatedParticipantId('');
    }
  }

  async function handleAuthenticate(participantId, pin) {
    const result = await verifyParticipantPin(participantId, pin);
    if (result.ok) {
      setAuthenticatedParticipantId(participantId);
    }
    return result;
  }

  function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowNavMenu(false);
  }

  return (
    <div className="app-shell">
      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-3 md:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-white/20 bg-gradient-to-r from-blue-600/95 to-indigo-700/95 p-3 text-white shadow-soft backdrop-blur">
          <div className="relative flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNavMenu((current) => !current)}
            aria-expanded={showNavMenu}
            aria-label="Toggle navigation menu"
            className="text-white hover:bg-white/15 hover:text-white"
          >
            {showNavMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="min-w-0 flex-1 text-center">
            <div className="text-sm font-semibold text-white">NadaBarkada Fitness Challenge</div>
          </div>

          <div className="relative flex min-w-0 items-center">
            <button
              type="button"
              onClick={() => setShowParticipantMenu((v) => !v)}
              aria-label="Select participant"
              className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-white/15"
            >
              <img
                src={getParticipantProfileImage(selectedParticipant?.profileImage)}
                alt={selectedParticipant?.name || 'Select participant'}
                className="h-9 w-9 flex-shrink-0 rounded-full border border-white/30 object-cover"
              />
              <div className="hidden min-w-0 text-right sm:block">
                {selectedParticipant ? (
                  <>
                    <div className="truncate text-sm font-semibold text-white">{selectedParticipant.name}</div>
                    <div className="text-xs text-blue-200">Change ▾</div>
                  </>
                ) : (
                  <div className="text-sm text-blue-200">Select Participant ▾</div>
                )}
              </div>
              <span className="text-xs text-blue-200 sm:hidden">▾</span>
            </button>

            {showParticipantMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowParticipantMenu(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-white/20 bg-gradient-to-b from-blue-600 to-indigo-700 p-2 shadow-soft">
                  <button
                    type="button"
                    onClick={() => { handleParticipantSelection(''); setShowParticipantMenu(false); }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/15 ${!selectedParticipantId ? 'bg-white/10' : ''}`}
                  >
                    <div className="h-8 w-8 flex-shrink-0 rounded-full border border-white/30 bg-white/10" />
                    <span className="text-blue-100">Select Participant</span>
                    {!selectedParticipantId && <span className="ml-auto text-xs text-white">✓</span>}
                  </button>
                  {derivedParticipants.map((p) => (
                    <button
                      key={p.id || p.name}
                      type="button"
                      onClick={() => { handleParticipantSelection(p.id); setShowParticipantMenu(false); }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/15 ${selectedParticipantId === p.id ? 'bg-white/15' : ''}`}
                    >
                      <img
                        src={getParticipantProfileImage(p.profileImage)}
                        alt={p.name}
                        className="h-8 w-8 flex-shrink-0 rounded-full border border-white/30 object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                      {selectedParticipantId === p.id && <span className="flex-shrink-0 text-xs">✓</span>}
                    </button>
                  ))}
                  <div className="mt-1 border-t border-white/15 pt-1">
                    <a
                      href={`sms:${ADMIN_PHONE_E164}?body=${encodeURIComponent(ADMIN_SMS_BODY)}`}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-blue-200 hover:bg-white/10"
                    >
                      <span>Not listed? Text Jay to register</span>
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {showNavMenu && (
            <div className="absolute left-0 top-full mt-3 w-60 rounded-2xl border border-white/20 bg-gradient-to-b from-blue-600 to-indigo-700 p-2 text-white shadow-soft">
              {[
                ['Daily Log Entry', 'daily-log-entry'],
                ['My Rings', 'my-rings'],
                ['Leaderboard', 'leaderboard'],
                ['My Profile', 'profile-panel'],
              ].map(([label, id]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/15"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      <div className="h-24" />

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

      {selectedParticipant && selectedParticipant.profileImage === DEFAULT_PROFILE_IMAGE && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <img
            src={getParticipantProfileImage('')}
            alt=""
            className="h-12 w-12 flex-shrink-0 rounded-full border border-amber-200 object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-amber-900">
              Hey {selectedParticipant.name.split(' ')[0]}, personalize your profile!
            </div>
            <div className="text-sm text-amber-700">
              Add a photo and confirm your display name before the challenge starts.
            </div>
          </div>
          <Button
            variant="outline"
            className="flex-shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
            onClick={() => { setShowProfile(true); scrollToSection('profile-panel'); }}
          >
            Set up my profile
          </Button>
        </div>
      )}

      <div className="mb-8 space-y-8">
        <div className="grid gap-6 xl:grid-cols-2">
          <div id="daily-log-entry" className="min-w-0">
            <DailyLogForm
              participant={selectedParticipant}
              onSubmit={handleLogEntry}
              loading={submittingLog}
              confirmedParticipantId={confirmedParticipantId}
              isAuthenticated={!!selectedParticipantId && selectedParticipantId === authenticatedParticipantId}
              onAuthenticate={handleAuthenticate}
            />
          </div>
          <div id="my-rings" className="min-w-0">
            <MyRingsPanel
              participants={derivedParticipants}
              logs={dailyLogs}
              selectedParticipantId={selectedParticipantId}
              isAuthenticated={!!selectedParticipantId && selectedParticipantId === authenticatedParticipantId}
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div id="leaderboard" className="min-w-0">
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

      <div id="profile-panel" className="mb-6 rounded-2xl border bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">My Profile</h2>
            <p className="section-subtitle">
              Update your display name and profile picture.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowProfile((current) => !current)}
            aria-expanded={showProfile}
          >
            {showProfile ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showProfile ? 'Collapse' : 'Open My Profile'}
          </Button>
        </div>
      </div>

      {showProfile && (
        <ProfilePanel
          key={selectedParticipant?.id}
          participant={selectedParticipant}
          participants={derivedParticipants}
          onUpdateProfile={handleUpdateParticipant}
          loading={loadingParticipants}
        />
      )}
    </div>
  );
}
