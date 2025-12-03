'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

export default function TeamDetailsModal({ teamId, isOpen, onClose }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (isOpen && teamId) {
      fetchTeamDetails();
    }
  }, [isOpen, teamId]);

  const fetchTeamDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/battle/team/${teamId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch team details');
      }

      setTeam(data.team);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/battle/team/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave team');
      }

      alert('Left team successfully');
      onClose();
      window.location.reload(); // Refresh to update leaderboard
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const isMember = currentUser && team?.members.some(m => m.userId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-panel/95 backdrop-blur-xl rounded-2xl shadow-card-glow border border-border-light overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-panel/95 backdrop-blur-xl border-b border-border-light px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gradient">
            {loading ? 'Loading...' : team?.name}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-panel-hover transition-all duration-300 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && team && (
            <div className="space-y-6">
              {/* Invite Code (only for members) */}
              {isMember && (
                <div className="card p-4 bg-gradient-to-br from-bts-purple/10 to-bts-pink/10 border-bts-purple/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted mb-1">Invite Code</p>
                      <p className="text-2xl font-mono font-bold text-white tracking-wider">
                        {team.inviteCode}
                      </p>
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      {copied ? '✓ Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              )}

              {/* Total Score */}
              <div className="text-center py-4">
                <p className="text-sm text-muted uppercase tracking-wider mb-2">Total Team Score</p>
                <p className="text-5xl font-extrabold text-gradient">{team.totalScore}</p>
                <p className="text-sm text-muted mt-2">{team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}</p>
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Team Members</h3>
                <div className="space-y-3">
                  {team.members.map((member, index) => {
                    const percentage = team.totalScore > 0
                      ? ((member.scrobbleCount / team.totalScore) * 100).toFixed(1)
                      : 0;

                    return (
                      <div
                        key={member.userId}
                        className="card p-4 hover:bg-panel-hover transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bts-purple to-bts-deep flex items-center justify-center text-white font-bold shadow-glow-purple">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.username}
                                className="w-full h-full rounded-xl object-cover"
                              />
                            ) : (
                              member.username.charAt(0).toUpperCase()
                            )}
                          </div>

                          {/* Member Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white">
                                {member.displayName || member.username}
                              </p>
                              {member.userId === team.creatorId && (
                                <span className="px-2 py-0.5 bg-bts-purple/20 border border-bts-purple/40 rounded text-xs font-semibold text-bts-purple">
                                  Creator
                                </span>
                              )}
                              {member.isCheater && (
                                <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded text-xs font-semibold text-red-300">
                                  Flagged
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted">@{member.username}</p>

                            {/* Progress Bar */}
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-muted mb-1">
                                <span>{member.scrobbleCount} scrobbles</span>
                                <span>{percentage}% of total</span>
                              </div>
                              <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-bts-purple to-bts-pink transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leave Team Button (only for members) */}
              {isMember && (
                <button
                  onClick={handleLeaveTeam}
                  className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-300 font-semibold rounded-xl transition-all duration-300"
                >
                  Leave Team
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
