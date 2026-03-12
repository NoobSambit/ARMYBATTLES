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
      className="fixed inset-0 bg-[#000000]/85 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 transition-all duration-400 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-[#090b14] border border-red-900/50 rounded-3xl shadow-[0_0_40px_rgba(220,38,38,0.15)] max-w-md w-full overflow-hidden animate-scale-in flex flex-col">
        {/* Glowing top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
        {/* Background glow behind title */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-red-900/20 blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="relative border-b border-white/[0.05] p-6 sm:px-8 bg-transparent">
          <h2 className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-red-200 to-red-600 flex items-center gap-3 drop-shadow-sm">
            <span className="material-symbols-outlined text-red-500">warning</span>
            Remove Participant
          </h2>
          <p className="text-red-400/80 text-xs font-bold tracking-widest uppercase mt-2">
            This action cannot be undone
          </p>
        </div>

        {/* Body */}
        <div className="relative z-10 p-6 sm:px-8">
          {error && (
            <div className="bg-red-950/30 border border-red-500/30 text-red-400 font-bold px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Participant info */}
            <div className="bg-black/40 border border-red-900/30 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
              <p className="text-[#c77dff] text-[10px] font-black tracking-widest uppercase mb-1.5">Removing:</p>
              <p className="text-white font-black text-xl tracking-wide">{participant?.username}</p>
              {participant?.score !== undefined && (
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-3">
                  Score: <span className="text-white ml-2">{participant.score.toLocaleString()}</span>
                </p>
              )}
            </div>

            {/* Reason input */}
            <div>
              <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Breaking rules..."
                maxLength={200}
                rows={3}
                disabled={isSubmitting}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:bg-red-950/10 focus:shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none font-medium"
              />
              <p className="text-gray-500 text-[10px] font-bold mt-2 text-right">
                {reason.length}/200
              </p>
            </div>

            {/* Warning message */}
            <div className="bg-yellow-950/20 border-l-2 border-yellow-500/50 p-4 rounded-r-xl">
              <p className="text-yellow-500/90 text-xs font-medium leading-relaxed">
                <span className="font-black text-yellow-500 uppercase tracking-widest block mb-1">Notice</span>
                The participant's score will be preserved for fairness, but they will no longer be able to contribute to the battle.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 sm:px-8 sm:py-6 flex gap-3 border-t border-white/[0.05]">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleKick}
            disabled={isSubmitting}
            className="group relative flex-[1.5] overflow-hidden bg-red-950/40 text-red-400 hover:text-white border border-red-900/50 hover:border-red-500 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isSubmitting && <div className="absolute inset-0 w-0 bg-gradient-to-r from-red-900 to-red-600 transition-all duration-500 ease-out group-hover:w-full z-0"></div>}
            <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Removing...</span>
                </>
              ) : (
                <>REMOVE PARTICIPANT</>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
