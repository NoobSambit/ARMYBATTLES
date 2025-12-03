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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-panel/95 backdrop-blur-xl rounded-2xl shadow-card-glow border border-border-light overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-bts-purple/20 to-bts-pink/20 border-b border-border-light px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gradient">
            {step === 1 && 'Join Battle'}
            {step === 2 && mode === 'team' && 'Team Options'}
            {step === 3 && 'Success!'}
          </h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl hover:bg-panel-hover transition-all duration-300 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Choose Mode */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-300 text-center mb-6">
                Choose how you want to participate in this battle
              </p>

              <button
                onClick={() => handleModeSelect('solo')}
                disabled={loading}
                className="w-full p-6 card hover:bg-panel-hover border-2 border-transparent hover:border-bts-pink/30 transition-all duration-300 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Join as Solo Player</h3>
                    <p className="text-sm text-muted">Compete individually against teams and other solo players</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => handleModeSelect('team')}
                disabled={loading}
                className="w-full p-6 card hover:bg-panel-hover border-2 border-transparent hover:border-bts-purple/30 transition-all duration-300 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bts-purple to-bts-pink flex items-center justify-center text-2xl">
                    👥
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Join or Create a Team</h3>
                    <p className="text-sm text-muted">Collaborate with others and combine your scrobbles</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
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
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTeamAction('create')}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-xl font-semibold transition-all duration-300',
                    teamAction === 'create'
                      ? 'bg-gradient-to-r from-bts-purple to-bts-deep text-white shadow-glow-purple'
                      : 'bg-surface-light text-gray-400 hover:text-white'
                  )}
                >
                  Create Team
                </button>
                <button
                  onClick={() => setTeamAction('join')}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-xl font-semibold transition-all duration-300',
                    teamAction === 'join'
                      ? 'bg-gradient-to-r from-bts-purple to-bts-deep text-white shadow-glow-purple'
                      : 'bg-surface-light text-gray-400 hover:text-white'
                  )}
                >
                  Join Team
                </button>
              </div>

              {teamAction === 'create' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-300 mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter your team name"
                      className="w-full px-4 py-3 bg-surface-light border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bts-pink focus:border-transparent transition-all"
                      maxLength={50}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted mt-1">{teamName.length}/50 characters</p>
                  </div>

                  <button
                    onClick={handleCreateTeam}
                    disabled={loading || !teamName.trim()}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Creating Team...</span>
                      </>
                    ) : (
                      'Create Team'
                    )}
                  </button>
                </div>
              )}

              {teamAction === 'join' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-2">
                      Invite Code
                    </label>
                    <input
                      type="text"
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Enter 8-character invite code"
                      className="w-full px-4 py-3 bg-surface-light border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bts-pink focus:border-transparent transition-all font-mono text-lg tracking-wider"
                      maxLength={8}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted mt-1">Get the invite code from your team creator</p>
                  </div>

                  <button
                    onClick={handleJoinTeam}
                    disabled={loading || inviteCode.length !== 8}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Joining Team...</span>
                      </>
                    ) : (
                      'Join Team'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-4xl">
                ✓
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Successfully Joined!</h3>
                <p className="text-gray-300">
                  {mode === 'solo' && "You're now participating as a solo player"}
                  {mode === 'team' && teamAction === 'create' && "Your team has been created"}
                  {mode === 'team' && teamAction === 'join' && "You've joined the team"}
                </p>
              </div>

              {createdTeam && (
                <div className="card p-4 bg-gradient-to-br from-bts-purple/10 to-bts-pink/10 border-bts-purple/30">
                  <p className="text-sm text-muted mb-2">Your Team Invite Code</p>
                  <p className="text-3xl font-mono font-bold text-white tracking-wider mb-3">
                    {createdTeam.inviteCode}
                  </p>
                  <button
                    onClick={copyInviteCode}
                    className="btn-secondary px-4 py-2 text-sm w-full"
                  >
                    Copy Invite Code
                  </button>
                  <p className="text-xs text-muted mt-2">Share this code with your team members!</p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full btn-primary"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
