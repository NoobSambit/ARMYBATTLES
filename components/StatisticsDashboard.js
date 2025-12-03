import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function StatisticsDashboard({ isOpen, onClose, battleId }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && battleId) {
      fetchStatistics();
    }
  }, [isOpen, battleId]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/battle/${battleId}/statistics`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] border border-blue-500/30 overflow-hidden animate-slideUp flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>📊</span>
                Battle Statistics
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {stats?.battleName || 'Loading...'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-purple-300 text-sm font-medium">Total Scrobbles</p>
                  <p className="text-white text-3xl font-bold mt-1">
                    {stats.stats.basic.totalScrobbles.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm font-medium">Active Participants</p>
                  <p className="text-white text-3xl font-bold mt-1">
                    {stats.stats.basic.activeParticipants}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-300 text-sm font-medium">Participation Rate</p>
                  <p className="text-white text-3xl font-bold mt-1">
                    {stats.stats.basic.participationRate}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm font-medium">Battle Progress</p>
                  <p className="text-white text-3xl font-bold mt-1">
                    {stats.stats.progress.percentComplete}%
                  </p>
                </div>
              </div>

              {/* Top Performers */}
              {stats.charts.topPerformers.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                    <span>🏆</span>
                    Top Performers
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.charts.topPerformers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="username" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="score" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Performance Stats Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                    <span>📈</span>
                    Performance Metrics
                  </h3>
                  <div className="space-y-3">
                    {stats.stats.performance.topPerformer && (
                      <div>
                        <p className="text-gray-400 text-sm">Top Performer</p>
                        <p className="text-white font-semibold">
                          {stats.stats.performance.topPerformer.username} ({stats.stats.performance.topPerformer.score})
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-sm">Avg Scrobbles per User</p>
                      <p className="text-white font-semibold">
                        {stats.stats.performance.avgScrobblesPerUser}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Active Scrobblers</p>
                      <p className="text-white font-semibold">
                        {stats.stats.performance.scrobblingUsers} / {stats.stats.basic.activeParticipants}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Extension & Removal Stats */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                    <span>⚙️</span>
                    Host Actions
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">Battle Extensions</p>
                      <p className="text-white font-semibold">
                        {stats.stats.extensions.timesExtended}
                      </p>
                    </div>
                    {stats.stats.extensions.timesExtended > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm">Total Extension Time</p>
                        <p className="text-white font-semibold">
                          {Math.round(stats.stats.extensions.totalExtensionTime / (1000 * 60 * 60))} hours
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-sm">Removed Participants</p>
                      <p className="text-white font-semibold">
                        {stats.stats.removals.kickedUsers}
                      </p>
                    </div>
                    {stats.stats.removals.kickedUsers > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm">Scores Removed</p>
                        <p className="text-white font-semibold">
                          {stats.stats.removals.totalScoresRemoved}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Distribution (if teams enabled) */}
              {stats.stats.teams && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                    <span>👥</span>
                    Participation Distribution
                  </h3>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Teams', value: stats.stats.teams.teamCount },
                            { name: 'Solo', value: stats.stats.teams.soloCount },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[0, 1].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Timeline Info */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                  <span>🕐</span>
                  Timeline
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Started</p>
                    <p className="text-white font-semibold">
                      {new Date(stats.stats.timeline.started).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ends</p>
                    <p className="text-white font-semibold">
                      {new Date(stats.stats.timeline.ends).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className="text-white font-semibold capitalize">
                      {stats.stats.timeline.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No statistics available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800/50 p-4 flex-shrink-0 flex gap-3">
          <button
            onClick={fetchStatistics}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
