import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, KeyRound, Loader2, LogOut, Menu, Plus, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RulesCard from '@/components/RulesCard';
import ProfilePanel from '@/components/ProfilePanel';
import AdminPanel from '@/components/AdminPanel';
import DailyLogForm from '@/components/DailyLogForm';
import LeaderboardTable from '@/components/LeaderboardTable';
import MyRingsPanel from '@/components/MyRingsPanel';
import WeekRingsCalendar from '@/components/WeekRingsCalendar';
import { Button } from '@/components/ui/button';
import {
  addParticipant,
  changeParticipantPin,
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

function formatFriendlyDate(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function App() {
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [participantsSource, setParticipantsSource] = useState('loading');
  const [leaderboardSource, setLeaderboardSource] = useState('loading');
  const [summarySource, setSummarySource] = useState('loading');
  const [isFetching, setIsFetching] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [submittingLog, setSubmittingLog] = useState(false);
  const serverBusy = isFetching || isAuthenticating || loadingParticipants || submittingLog;
  const [message, setMessage] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const STAY_LOGGED_IN_KEY = 'fitness-challenge:stay-logged-in-as';

  const [selectedParticipantId, setSelectedParticipantId] = useState(
    () => window.localStorage.getItem(STAY_LOGGED_IN_KEY) || ''
  );
  const [confirmedParticipantId, setConfirmedParticipantId] = useState('');
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showParticipantMenu, setShowParticipantMenu] = useState(false);
  const [authenticatedParticipantId, setAuthenticatedParticipantId] = useState(
    () => window.localStorage.getItem(STAY_LOGGED_IN_KEY) || ''
  );
  const [showPinReminder, setShowPinReminder] = useState(false);
  const [logDate, setLogDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  async function loadAll() {
    setIsFetching(true);
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
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const derivedParticipants = useMemo(
    () => mergeParticipantsWithBaselines(participants, dailyLogs),
    [participants, dailyLogs]
  );
  const selectedParticipantLogs = useMemo(
    () => dailyLogs.filter((log) => log.participantId === selectedParticipantId),
    [dailyLogs, selectedParticipantId]
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
        const pts = result?.data?.dailyPoints;
        toast.success(`Log saved for ${formatFriendlyDate(payload.date)}!`, {
          description: pts != null ? `Daily points: ${pts} / 10` : 'Entry recorded successfully.',
        });
      }
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
      setShowPinReminder(false);
    }
  }

  async function handleAuthenticate(participantId, pin, stayLoggedIn = false) {
    setIsAuthenticating(true);
    const result = await verifyParticipantPin(participantId, pin).finally(() => setIsAuthenticating(false));
    if (result.ok) {
      setAuthenticatedParticipantId(participantId);
      if (stayLoggedIn) {
        window.localStorage.setItem(STAY_LOGGED_IN_KEY, participantId);
      }
      const pinChangedKey = `fitness-challenge:pin-changed:${participantId}`;
      if (!window.localStorage.getItem(pinChangedKey)) {
        setShowPinReminder(true);
      }
      const p = participants.find(x => x.id === participantId);
      toast.success(`Welcome back${p ? `, ${p.name.split(' ')[0]}` : ''}!`, {
        description: 'You are now logged in.',
      });
    }
    return result;
  }

  function handleLogout() {
    setSelectedParticipantId('');
    setAuthenticatedParticipantId('');
    setShowPinReminder(false);
    window.localStorage.removeItem(STAY_LOGGED_IN_KEY);
  }

  function handlePinChanged(participantId) {
    window.localStorage.setItem(`fitness-challenge:pin-changed:${participantId}`, '1');
    setShowPinReminder(false);
    loadAll();
  }

  async function handleAdminUpdateParticipant(payload) {
    const result = await updateParticipant(payload);
    if (result.ok) await loadAll();
    return result;
  }

  async function handleAdminAddParticipant(payload) {
    const result = await addParticipant(payload);
    if (result.ok) await loadAll();
    return result;
  }

  async function handleAdminResetPin(participantId) {
    const result = await changeParticipantPin(participantId, '0000');
    // Clear the "already changed" flag so they get the reminder on next login
    window.localStorage.removeItem(`fitness-challenge:pin-changed:${participantId}`);
    return result;
  }

  const isAuthenticated = !!selectedParticipantId && selectedParticipantId === authenticatedParticipantId;
  const isAdmin = isAuthenticated && selectedParticipant?.role === 'admin';

  // On mobile: when a participant is selected but not yet authenticated, scroll to the daily log
  useEffect(() => {
    if (selectedParticipantId && !isAuthenticated) {
      if (window.innerWidth < 768) {
        setTimeout(() => {
          document.getElementById('daily-log-entry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParticipantId]);

  // When PIN reminder fires, auto-open profile and scroll to it
  useEffect(() => {
    if (showPinReminder) {
      setShowProfile(true);
      setTimeout(() => {
        document.getElementById('profile-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [showPinReminder]);

  function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowNavMenu(false);
  }

  return (
    <div className="app-shell min-h-screen flex flex-col">
      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-3 md:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-white/25 bg-gradient-to-r from-blue-600/95 to-indigo-700/95 p-3 text-white shadow-lg ring-1 ring-inset ring-white/10 backdrop-blur">
          <div className="relative flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNavMenu((current) => !current)}
            aria-expanded={showNavMenu}
            aria-label="Toggle navigation menu"
            className="rounded-xl bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            {showNavMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="min-w-0 flex-1 text-center">
            <div className="flex items-center justify-center gap-2 font-semibold text-white">
              <span className="hidden text-sm sm:inline">NadaBarkada Fitness Challenge</span>
              <span className="text-sm sm:hidden">NB Fitness</span>
              {serverBusy && <Loader2 className="h-4 w-4 animate-spin text-blue-200" />}
            </div>
          </div>

          <div className="relative flex min-w-0 items-center">
            {!selectedParticipantId && !showParticipantMenu && (
              <div className="pointer-events-none absolute -bottom-12 right-0 z-30 animate-bounce">
                <div className="relative rounded-2xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg">
                  Select participant
                  <div className="absolute -top-2 right-4 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-white" />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowParticipantMenu((v) => !v)}
              aria-label="Select participant"
              className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-white/15"
            >
              <div className="relative h-9 w-9 flex-shrink-0">
                <img
                  src={getParticipantProfileImage(selectedParticipant?.profileImage)}
                  alt={selectedParticipant?.name || 'Select participant'}
                  className="h-9 w-9 rounded-full border border-white/30 object-cover"
                />
                {serverBusy && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
                {isAdmin && !serverBusy && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 ring-1 ring-indigo-700">
                    <ShieldCheck className="h-2.5 w-2.5 text-yellow-900" />
                  </div>
                )}
              </div>
              <div className="hidden min-w-0 text-right sm:block">
                {selectedParticipant ? (
                  <>
                    <div className="truncate text-sm font-semibold text-white">{selectedParticipant.name}</div>
                    <div className="text-xs text-blue-200">{isAuthenticated ? 'Logged in ▾' : 'Change ▾'}</div>
                  </>
                ) : (
                  <div className="text-sm text-blue-200">Select Participant ▾</div>
                )}
              </div>
              <span className="text-xs text-blue-200 sm:hidden">▾</span>
            </button>

            {showParticipantMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowParticipantMenu(false)} />
                <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-white/20 bg-gradient-to-b from-blue-600 to-indigo-700 p-2 shadow-soft">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2">
                        <div className="relative h-8 w-8 flex-shrink-0">
                          <img
                            src={getParticipantProfileImage(selectedParticipant?.profileImage)}
                            alt={selectedParticipant?.name}
                            className="h-8 w-8 rounded-full border border-white/30 object-cover"
                          />
                          {serverBusy && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white">{selectedParticipant?.name}</div>
                          {selectedParticipant?.teamName && (
                            <div className="truncate text-xs text-blue-200">{selectedParticipant.teamName}</div>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-xs text-white">✓</span>
                      </div>
                      <div className="mt-1 border-t border-white/15 pt-1">
                        <button
                          type="button"
                          onClick={() => { handleLogout(); setShowParticipantMenu(false); }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-blue-200 hover:bg-white/15 hover:text-white"
                        >
                          <LogOut className="h-4 w-4" />
                          Log out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { handleParticipantSelection(''); setShowParticipantMenu(false); }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/15 ${!selectedParticipantId ? 'bg-white/10' : ''}`}
                      >
                        <div className="h-8 w-8 flex-shrink-0 rounded-full border border-white/30 bg-white/10" />
                        <span className="text-blue-100">Select Participant</span>
                        {!selectedParticipantId && <span className="ml-auto text-xs text-white">✓</span>}
                      </button>
                      {[...derivedParticipants].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                        <button
                          key={p.id || p.name}
                          type="button"
                          onClick={() => { handleParticipantSelection(p.id); setShowParticipantMenu(false); }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/15 ${selectedParticipantId === p.id ? 'bg-white/15' : ''}`}
                        >
                          <div className="relative h-8 w-8 flex-shrink-0">
                            <img
                              src={getParticipantProfileImage(p.profileImage)}
                              alt={p.name}
                              className="h-8 w-8 rounded-full border border-white/30 object-cover"
                            />
                            {serverBusy && selectedParticipantId === p.id && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                              </div>
                            )}
                          </div>
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
                    </>
                  )}
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
                ...(isAuthenticated ? [['My Profile', 'profile-panel']] : []),
                ...(isAdmin ? [['Admin Panel', 'admin-panel']] : []),
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
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-soft">
          <span>{message}</span>
          <Button size="sm" variant="outline" className="flex-shrink-0 border-red-300 text-red-700 hover:bg-red-100" onClick={() => { setMessage(''); loadAll(); }}>
            Retry
          </Button>
        </div>
      )}

      {selectedParticipant && isAuthenticated && selectedParticipant.profileImage === DEFAULT_PROFILE_IMAGE && (
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

      {showPinReminder && selectedParticipant && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <KeyRound className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-indigo-900">
              Change your PIN
            </div>
            <div className="text-sm text-indigo-700">
              You're using a default PIN. Head to My Profile to set a personal one.
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-300 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-900"
              onClick={() => { setShowProfile(true); scrollToSection('profile-panel'); }}
            >
              Go to My Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700"
              onClick={() => setShowPinReminder(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="mb-8 space-y-8">
        <div className="grid gap-6 xl:grid-cols-2">
          <div id="daily-log-entry" className="min-w-0">
            <DailyLogForm
              participant={selectedParticipant}
              participantLogs={selectedParticipantLogs}
              onSubmit={handleLogEntry}
              loading={submittingLog}
              confirmedParticipantId={confirmedParticipantId}
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              onAuthenticate={handleAuthenticate}
              onLogout={handleLogout}
              onDateChange={setLogDate}
            />
          </div>
          <div id="my-rings" className="min-w-0">
            <MyRingsPanel
              participants={derivedParticipants}
              logs={dailyLogs}
              selectedParticipantId={selectedParticipantId}
              isAuthenticated={isAuthenticated}
              selectedDate={logDate}
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
              {isAuthenticated
                ? 'Update your display name, profile picture, and PIN.'
                : 'Authenticate in Daily Log to access your profile.'}
            </p>
          </div>
          <Button
            variant="outline"
            disabled={!isAuthenticated}
            onClick={() => setShowProfile((current) => !current)}
            aria-expanded={showProfile}
          >
            {showProfile ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {showProfile ? 'Collapse' : 'Open My Profile'}
          </Button>
        </div>
      </div>

      {isAuthenticated && showProfile && (
        <ProfilePanel
          key={selectedParticipant?.id}
          participant={selectedParticipant}
          onUpdateProfile={handleUpdateParticipant}
          onPinChanged={handlePinChanged}
          loading={loadingParticipants}
          showPinBubble={showPinReminder}
        />
      )}

      {isAdmin && (
        <div id="admin-panel" className="mb-6 rounded-2xl border-2 border-red-400 bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Admin Panel</h2>
              <p className="section-subtitle">Manage participants, avatars, and PINs.</p>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => setShowAdmin((current) => !current)}
              aria-expanded={showAdmin}
            >
              {showAdmin ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              {showAdmin ? 'Collapse' : 'Open Admin Panel'}
            </Button>
          </div>
        </div>
      )}

      {isAdmin && showAdmin && (
        <div className="mb-6">
          <AdminPanel
            participants={derivedParticipants}
            onResetPin={handleAdminResetPin}
            onAddParticipant={handleAdminAddParticipant}
            onUpdateParticipant={handleAdminUpdateParticipant}
          />
        </div>
      )}

      {/* Mobile FAB — scroll to daily log */}
      <button
        type="button"
        onClick={() => document.getElementById('daily-log-entry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-blue-600/30 transition-transform hover:scale-110 active:scale-95 sm:hidden"
        aria-label="Go to daily log"
      >
        <Plus className="h-7 w-7" />
      </button>

      <Footer />
    </div>
  );
}
