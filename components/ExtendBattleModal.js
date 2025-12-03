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
      const response = await fetch(`/api/battle/${battle._id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          newEndTime,
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-blue-500/30 overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>⏰</span>
            Extend Battle Time
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Give participants more time to compete
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
            {/* Current end time */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Current end time:</p>
              <p className="text-white font-semibold">
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
                <p className="text-yellow-400 text-xs mt-2">
                  ⚡ Extended {battle.extensionHistory.length} time(s)
                </p>
              )}
            </div>

            {/* Preset buttons */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Quick extend:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => handlePresetClick(hours)}
                    disabled={isSubmitting}
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                      presetHours === hours
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    +{hours}h
                  </button>
                ))}
              </div>
            </div>

            {/* Custom end time */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                New end time:
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
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {extensionHours && (
                <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                  <span>✓</span>
                  Extending by <strong>{extensionHours} hours</strong>
                </p>
              )}
              {extensionHours !== null && extensionHours <= 0 && (
                <p className="text-red-400 text-sm mt-2">
                  New end time must be after current end time
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
                placeholder="e.g., High engagement, technical issues, popular request, etc."
                maxLength={200}
                rows={2}
                disabled={isSubmitting}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
              <p className="text-gray-500 text-xs mt-1 text-right">
                {reason.length}/200
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
            onClick={handleExtend}
            disabled={isSubmitting || !extensionHours || extensionHours <= 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Extending...</span>
              </>
            ) : (
              <span>Extend Battle</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
