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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#000000]/85 backdrop-blur-xl transition-all duration-400 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#090b14] border border-[#7b2cbf]/30 rounded-3xl shadow-[0_0_40px_rgba(157,78,221,0.2)] overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
        {/* Animated gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c77dff] to-transparent opacity-50" />

        {/* Subtle glow behind title */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#7b2cbf]/10 blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.05] bg-transparent">
          <div>
            <h2 className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#f3e8ff] via-[#d8b4fe] to-[#9333ea] mb-1 tracking-tight drop-shadow-sm">
              {loading ? 'Loading Details...' : team?.name || team?.teamName || 'Team Details'}
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-[#c77dff] to-[#5a189a] rounded-full shadow-[0_0_10px_rgba(157,78,221,0.5)]" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-300 p-2.5 rounded-xl hover:bg-white/5 hover:rotate-90 hover:scale-110 transform group"
          >
            <span className="material-symbols-outlined group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 sm:px-8 py-6 pb-8 overflow-y-auto w-full">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <div className="bg-red-950/30 border border-red-500/30 text-red-400 font-bold px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {!loading && !error && team && (
            <div className="space-y-8">
              {/* Invite Code (only for members) */}
              {isMember && (
                <div className="relative overflow-hidden bg-black/40 border border-[#7b2cbf]/40 p-5 rounded-2xl shadow-[0_0_20px_rgba(123,44,191,0.1)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#c77dff]/10 blur-3xl rounded-full"></div>
                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black tracking-widest text-[#c77dff] mb-2 uppercase">INVITE CODE</p>
                      <p className="text-3xl font-mono font-black text-white tracking-[0.2em] select-all">
                        {team.inviteCode}
                      </p>
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="group relative overflow-hidden bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:border-white/30 font-bold px-6 py-3 rounded-xl transition-all duration-300 w-full sm:w-auto text-sm"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[1.1rem]">{copied ? 'task_alt' : 'content_copy'}</span>
                        {copied ? 'COPIED' : 'COPY CODE'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Total Score */}
              <div className="text-center py-6 px-4 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl border border-white/5">
                <p className="text-sm text-gray-500 font-black uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">leaderboard</span> TOTAL TEAM SCORE
                </p>
                <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-[#f3e8ff] to-[#9d4edd] tracking-tighter drop-shadow-md mb-2">
                  {team.totalScore.toLocaleString()}
                </p>
                <p className="text-[11px] text-[#c77dff] font-bold uppercase tracking-widest mt-2 px-3 py-1 bg-[#7b2cbf]/10 inline-block rounded-md border border-[#7b2cbf]/30">
                  {team.memberCount} MEMBER{team.memberCount !== 1 && 'S'} ACTIVE
                </p>
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-sm font-black text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#c77dff] text-base">group</span> Team Members
                </h3>
                <div className="space-y-3">
                  {team.members.map((member, index) => {
                    const percentage = team.totalScore > 0
                      ? ((member.scrobbleCount / team.totalScore) * 100).toFixed(1)
                      : 0;

                    return (
                      <div
                        key={member.userId}
                        className="group relative overflow-hidden bg-[#090b14] border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:border-[#7b2cbf]/30 hover:shadow-[0_0_20px_rgba(123,44,191,0.15)]"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#7b2cbf]/5 blur-[20px] pointer-events-none group-hover:bg-[#7b2cbf]/10 transition-colors"></div>
                        <div className="relative flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center text-white font-black overflow-hidden shadow-inner group-hover:border-[#c77dff]/50 transition-colors">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[#c77dff] text-lg">{member.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          {/* Member Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-bold text-gray-100 group-hover:text-white transition-colors truncate">
                                {member.displayName || member.username}
                              </p>
                              {member.userId === team.creatorId && (
                                <span className="px-2 py-0.5 bg-[#7b2cbf]/20 border border-[#7b2cbf]/50 rounded text-[10px] font-black tracking-widest text-[#e0aaff] uppercase">
                                  Creator
                                </span>
                              )}
                              {member.isCheater && (
                                <span className="px-2 py-0.5 bg-red-950/50 border border-red-500/50 rounded text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                                  Flagged
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium">@{member.username}</p>

                            {/* Progress Bar */}
                            <div className="mt-2.5">
                              <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                                <span className="text-[#e0aaff]">SCROBBLES: {member.scrobbleCount.toLocaleString()}</span>
                                <span>{percentage}% OF TOTAL</span>
                              </div>
                              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                <div
                                  className="h-full bg-gradient-to-r from-[#c77dff] to-[#5a189a] shadow-[0_0_10px_rgba(157,78,221,0.5)] transition-all duration-1000 ease-out"
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
                <div className="pt-4 mt-8 border-t border-white/[0.05]">
                  <button
                    onClick={handleLeaveTeam}
                    className="w-full px-4 py-3.5 bg-red-950/20 hover:bg-red-900/40 border border-red-900/50 hover:border-red-500/50 text-red-400 hover:text-red-300 font-bold rounded-xl transition-all duration-300 uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">logout</span>
                    LEAVE TEAM
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
