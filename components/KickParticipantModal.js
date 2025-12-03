import { useState } from 'react';

export default function KickParticipantModal({ isOpen, onClose, participant, battleId, onKickSuccess }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleKick = async () => {
    if (!participant) return;

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken') || 'mock-token';
      const response = await fetch(`/api/battle/${battleId}/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: participant.userId,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to kick participant');
      }

      // Success
      if (onKickSuccess) {
        onKickSuccess(data);
      }

      // Reset and close
      setReason('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-red-500/30 overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>⚠️</span>
            Remove Participant
          </h2>
          <p className="text-red-100 text-sm mt-1">
            This action cannot be undone
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Participant info */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Removing:</p>
              <p className="text-white font-semibold text-lg">{participant?.username}</p>
              {participant?.score !== undefined && (
                <p className="text-gray-400 text-sm mt-2">
                  Current score: <span className="text-white font-medium">{participant.score}</span>
                </p>
              )}
            </div>

            {/* Reason input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Violating rules, cheating, etc."
                maxLength={200}
                rows={3}
                disabled={isSubmitting}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
              <p className="text-gray-500 text-xs mt-1 text-right">
                {reason.length}/200
              </p>
            </div>

            {/* Warning message */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-200 text-sm">
                <strong>Note:</strong> The participant's score will be preserved for fairness,
                but they will no longer be able to contribute to the battle.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800/50 p-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleKick}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Removing...</span>
              </>
            ) : (
              <span>Remove Participant</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
