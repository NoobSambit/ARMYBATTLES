'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

export default function BattleJoinModal({ battleId, isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: choose mode, 2: team options, 3: success
  const [mode, setMode] = useState(''); // 'solo' or 'team'
  const [teamAction, setTeamAction] = useState(''); // 'create' or 'join'
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdTeam, setCreatedTeam] = useState(null);

  const reset = () => {
    setStep(1);
    setMode('');
    setTeamAction('');
    setTeamName('');
    setInviteCode('');
    setError('');
    setCreatedTeam(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'solo') {
      // Go directly to join for solo
      handleJoinSolo();
    } else {
      // Go to team options
      setStep(2);
    }
  };

  const handleJoinSolo = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/battle/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ battleId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join battle');
      }

      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // First join the battle
      const joinResponse = await fetch('/api/battle/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ battleId }),
      });

      if (!joinResponse.ok) {
        const joinData = await joinResponse.json();
        // If already joined, continue to create team
        if (!joinData.error?.includes('already joined')) {
          throw new Error(joinData.error || 'Failed to join battle');
        }
      }

      // Now create the team
      const teamResponse = await fetch('/api/battle/team/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ battleId, teamName: teamName.trim() }),
      });

      const teamData = await teamResponse.json();

      if (!teamResponse.ok) {
        throw new Error(teamData.error || 'Failed to create team');
      }

      setCreatedTeam(teamData.team);
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // First join the battle
      const joinResponse = await fetch('/api/battle/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ battleId }),
      });

      if (!joinResponse.ok) {
        const joinData = await joinResponse.json();
        if (!joinData.error?.includes('already joined')) {
          throw new Error(joinData.error || 'Failed to join battle');
        }
      }

      // Now join the team
      const teamResponse = await fetch('/api/battle/team/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });

      const teamData = await teamResponse.json();

      if (!teamResponse.ok) {
        throw new Error(teamData.error || 'Failed to join team');
      }

      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (createdTeam?.inviteCode) {
      navigator.clipboard.writeText(createdTeam.inviteCode);
      alert('Invite code copied to clipboard!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#000000]/85 backdrop-blur-xl animate-fade-in transition-all duration-400"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#090b14] border border-[#7b2cbf]/30 rounded-3xl shadow-[0_0_40px_rgba(157,78,221,0.2)] overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
        {/* Animated gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c77dff] to-transparent opacity-50" />

        {/* Subtle glow behind title */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#7b2cbf]/10 blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-white/[0.05] bg-transparent">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#f3e8ff] via-[#d8b4fe] to-[#9333ea] mb-1.5 tracking-tight drop-shadow-sm">
              {step === 1 && 'Deploy Force'}
              {step === 2 && mode === 'team' && 'Team Battles'}
              {step === 3 && 'Successfully Joined'}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-[#c77dff] to-[#5a189a] rounded-full shadow-[0_0_10px_rgba(157,78,221,0.5)]" />
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-all duration-300 p-2.5 rounded-xl hover:bg-white/5 hover:rotate-90 hover:scale-110 transform group"
          >
            <svg className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 sm:px-8 py-6 pb-8 overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-xl mb-6 font-medium">
              {error}
            </div>
          )}

          {/* Step 1: Choose Mode */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm font-medium mb-6">
                Select how you want to play for this battle
              </p>

              <button
                onClick={() => handleModeSelect('solo')}
                disabled={loading}
                className="w-full p-5 bg-black/40 border border-white/5 hover:border-[#7b2cbf]/50 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden flex items-center gap-4 hover:shadow-[0_0_20px_rgba(123,44,191,0.15)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#7b2cbf]/0 to-[#7b2cbf]/5 group-hover:to-[#7b2cbf]/20 transition-all duration-500" />
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 group-hover:border-[#7b2cbf]/40 flex items-center justify-center flex-shrink-0 transition-colors z-10">
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-[#c77dff] text-2xl transition-colors">person</span>
                </div>
                <div className="flex-1 z-10">
                  <h3 className="text-lg font-black text-gray-200 group-hover:text-white mb-0.5 tracking-wide transition-colors">Lone Wolf</h3>
                  <p className="text-xs text-gray-500 group-hover:text-gray-400 font-medium">Operate individually, climb the ranks alone.</p>
                </div>
                <span className="material-symbols-outlined text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-1 z-10 text-xl">arrow_forward_ios</span>
              </button>

              <button
                onClick={() => handleModeSelect('team')}
                disabled={loading}
                className="w-full p-5 bg-black/40 border border-white/5 hover:border-[#9d4edd]/50 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden flex items-center gap-4 hover:shadow-[0_0_20px_rgba(157,78,221,0.15)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd]/0 to-[#9d4edd]/5 group-hover:to-[#9d4edd]/20 transition-all duration-500" />
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 group-hover:border-[#9d4edd]/40 flex items-center justify-center flex-shrink-0 transition-colors z-10">
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-[#e0aaff] text-2xl transition-colors">groups</span>
                </div>
                <div className="flex-1 z-10">
                  <h3 className="text-lg font-black text-gray-200 group-hover:text-white mb-0.5 tracking-wide transition-colors">Make a Team</h3>
                  <p className="text-xs text-gray-500 group-hover:text-gray-400 font-medium">Create a team and combine your streams.</p>
                </div>
                <span className="material-symbols-outlined text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-1 z-10 text-xl">arrow_forward_ios</span>
              </button>

              {loading && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Team Options */}
          {step === 2 && mode === 'team' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-6 bg-black/40 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setTeamAction('create')}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg font-bold transition-all duration-300 text-sm tracking-wide',
                    teamAction === 'create'
                      ? 'bg-[#7b2cbf] text-white shadow-[0_0_15px_rgba(123,44,191,0.4)]'
                      : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  CREATE TEAM
                </button>
                <button
                  onClick={() => setTeamAction('join')}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg font-bold transition-all duration-300 text-sm tracking-wide',
                    teamAction === 'join'
                      ? 'bg-[#7b2cbf] text-white shadow-[0_0_15px_rgba(123,44,191,0.4)]'
                      : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  JOIN TEAM
                </button>
              </div>

              {teamAction === 'create' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-300 mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name..."
                      className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-medium"
                      maxLength={50}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-2 font-medium">{teamName.length}/50 characters available</p>
                  </div>

                  <button
                    onClick={handleCreateTeam}
                    disabled={loading || !teamName.trim()}
                    className="group relative w-full overflow-hidden bg-[#7b2cbf]/20 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(157,78,221,0.3)] hover:-translate-y-1 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {!loading && <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>}
                    <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase">
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>INITIALIZING...</span>
                        </>
                      ) : (
                        'CREATE TEAM'
                      )}
                    </span>
                  </button>
                </div>
              )}

              {teamAction === 'join' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-2">
                      Access Code
                    </label>
                    <input
                      type="text"
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="8-CHARACTER CODE"
                      className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all placeholder:text-gray-600 font-mono tracking-[0.2em] font-bold"
                      maxLength={8}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-2 font-medium">Ask your team creator for the invite code</p>
                  </div>

                  <button
                    onClick={handleJoinTeam}
                    disabled={loading || inviteCode.length !== 8}
                    className="group relative w-full overflow-hidden bg-[#7b2cbf]/20 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(157,78,221,0.3)] hover:-translate-y-1 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {!loading && <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>}
                    <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest uppercase">
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>AUTHENTICATING...</span>
                        </>
                      ) : (
                        'JOIN TEAM'
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="space-y-8 text-center py-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.2)]">
                <span className="material-symbols-outlined text-5xl text-green-400">check_circle</span>
              </div>

              <div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Successfully Joined!</h3>
                <p className="text-gray-400 font-medium">
                  {mode === 'solo' && "Playing solo. Ready to stream."}
                  {mode === 'team' && teamAction === 'create' && "Team created. You can now invite members."}
                  {mode === 'team' && teamAction === 'join' && "Successfully joined team."}
                </p>
              </div>

              {createdTeam && (
                <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                  <p className="text-xs font-bold text-[#c77dff] uppercase tracking-widest mb-3">INVITE CODE</p>
                  <p className="text-4xl font-mono font-black text-white tracking-[0.2em] mb-5 select-all">
                    {createdTeam.inviteCode}
                  </p>
                  <button
                    onClick={copyInviteCode}
                    className="group relative w-full overflow-hidden bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:border-white/30 font-bold py-3.5 rounded-xl transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[1.2rem]">content_copy</span>
                      COPY CODE
                    </span>
                  </button>
                  <p className="text-xs text-gray-500 font-medium mt-3">Share this code with your team</p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="group relative w-full overflow-hidden bg-[#7b2cbf]/20 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(157,78,221,0.3)] hover:-translate-y-1"
              >
                <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>
                <span className="relative z-10 tracking-widest uppercase">DISMISS</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
