import { useState, useEffect } from 'react';

export default function ExtendBattleModal({ isOpen, onClose, battle, onExtendSuccess }) {
  const [newEndTime, setNewEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [presetHours, setPresetHours] = useState(null);

  useEffect(() => {
    if (isOpen && battle) {
      // Set default to 24 hours from current end time
      const currentEnd = new Date(battle.endTime);
      currentEnd.setHours(currentEnd.getHours() + 24);
      setNewEndTime(formatDateTimeLocal(currentEnd));
      setPresetHours(24);
    }
  }, [isOpen, battle]);

  if (!isOpen || !battle) return null;

  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handlePresetClick = (hours) => {
    const currentEnd = new Date(battle.endTime);
    currentEnd.setHours(currentEnd.getHours() + hours);
    setNewEndTime(formatDateTimeLocal(currentEnd));
    setPresetHours(hours);
  };

  const calculateExtension = () => {
    if (!newEndTime) return null;
    const currentEnd = new Date(battle.endTime);
    const newEnd = new Date(newEndTime);
    const diff = newEnd - currentEnd;
    const hours = Math.round(diff / (1000 * 60 * 60) * 10) / 10;
    return hours > 0 ? hours : null;
  };

  const handleExtend = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // Convert datetime-local to UTC ISO string
      // This ensures the time entered in user's local timezone is correctly stored as UTC
      const convertToUTC = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;
        const localDate = new Date(dateTimeLocal);
        return localDate.toISOString();
      };

      const response = await fetch(`/api/battle/${battle._id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEndTime: convertToUTC(newEndTime),
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extend battle');
      }

      // Success
      if (onExtendSuccess) {
        onExtendSuccess(data);
      }

      // Reset and close
      setReason('');
      setNewEndTime('');
      setPresetHours(null);
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

  const extensionHours = calculateExtension();
  const currentEndDate = new Date(battle.endTime);

  return (
    <div
      className="fixed inset-0 bg-[#000000]/85 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 transition-all duration-400 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-[#090b14] border border-[#7b2cbf]/30 rounded-3xl shadow-[0_0_40px_rgba(157,78,221,0.2)] max-w-lg w-full overflow-hidden animate-scale-in flex flex-col">
        {/* Glowing top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c77dff] to-transparent opacity-50" />
        {/* Background glow behind title */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#7b2cbf]/20 blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="relative border-b border-white/[0.05] p-6 sm:px-8 bg-transparent">
          <h2 className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-[#f3e8ff] to-[#9d4edd] flex items-center gap-3 drop-shadow-sm">
            <span className="material-symbols-outlined text-[#c77dff]">update</span>
            Extend Duration
          </h2>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-2">
            Give participants more time to stream
          </p>
        </div>

        {/* Body */}
        <div className="relative z-10 p-6 sm:px-8 space-y-6">
          {error && (
            <div className="bg-red-950/30 border border-red-500/30 text-red-400 font-bold px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Current end time */}
          <div className="bg-black/40 border border-[#7b2cbf]/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#7b2cbf]/5 pointer-events-none"></div>
            <p className="text-[#c77dff] text-[10px] font-black tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              CURRENT END TIME
            </p>
            <p className="text-white font-black text-lg sm:text-xl tracking-wide">
              {currentEndDate.toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {battle.extensionHistory && battle.extensionHistory.length > 0 && (
              <p className="text-yellow-500 text-[10px] font-bold mt-3 uppercase tracking-widest bg-yellow-950/30 inline-block px-2 py-1 rounded-md border border-yellow-500/20">
                ⚡ Extended {battle.extensionHistory.length} time(s) prior
              </p>
            )}
          </div>

          <div className="space-y-5">
            {/* Preset buttons */}
            <div>
              <label className="block text-gray-400 text-[10px] font-black tracking-widest uppercase mb-3">
                Quick Extend:
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {[12, 24, 48, 72].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => handlePresetClick(hours)}
                    disabled={isSubmitting}
                    className={`py-3 px-3 rounded-xl font-black text-xs transition-all tracking-wider ${presetHours === hours
                      ? 'bg-[#c77dff] text-white shadow-[0_0_15px_rgba(199,125,255,0.4)]'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-[#7b2cbf]/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    +{hours}H
                  </button>
                ))}
              </div>
            </div>

            {/* Custom end time */}
            <div>
              <label className="block text-gray-400 text-[10px] font-black tracking-widest uppercase mb-3">
                New End Time:
              </label>
              <input
                type="datetime-local"
                value={newEndTime}
                onChange={(e) => {
                  setNewEndTime(e.target.value);
                  setPresetHours(null);
                }}
                min={formatDateTimeLocal(new Date())}
                disabled={isSubmitting}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase font-bold tracking-wider"
              />
              {extensionHours && (
                <p className="text-[#a7f3d0] text-xs mt-3 flex items-center gap-1.5 font-bold tracking-wider">
                  <span className="material-symbols-outlined text-sm">task_alt</span>
                  EXTENDING BY <span className="text-white">{extensionHours} HOURS</span>
                </p>
              )}
              {extensionHours !== null && extensionHours <= 0 && (
                <p className="text-red-400 text-xs mt-3 font-bold uppercase tracking-wider">
                  New end time must be after current end time
                </p>
              )}
            </div>

            {/* Reason input */}
            <div>
              <label className="block text-gray-400 text-[10px] font-black tracking-widest uppercase mb-3">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. High engagement, technical issues..."
                maxLength={200}
                rows={2}
                disabled={isSubmitting}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#c77dff] focus:bg-[#7b2cbf]/10 focus:shadow-[0_0_15px_rgba(157,78,221,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none font-medium"
              />
              <p className="text-gray-500 text-[10px] font-bold mt-2 text-right">
                {reason.length}/200
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 sm:px-8 flex gap-3 border-t border-white/[0.05]">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleExtend}
            disabled={isSubmitting || !extensionHours || extensionHours <= 0}
            className="group relative flex-[1.5] overflow-hidden bg-[#7b2cbf]/20 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(157,78,221,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(!isSubmitting && extensionHours > 0) && <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>}
            <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-[#c77dff]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>EXTEND BATTLE</>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
