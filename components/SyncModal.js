'use client';

export default function SyncModal({ isOpen, onClose, onQuickSync, onFullSync, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-lg bg-gray-900 border border-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
          <h2 className="text-lg font-bold text-white">Sync Scrobbles</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Quick Sync */}
          <div className="space-y-2">
            <button
              onClick={() => {
                onQuickSync();
                onClose();
              }}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/50 p-4 text-left transition-all hover:scale-[1.02] disabled:hover:scale-100"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Quick Sync</h3>
                  <p className="text-xs text-blue-200">Recommended for regular updates</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Syncs around <span className="font-semibold text-white">~500 scrobbles</span> (more or less).
                Takes <span className="font-semibold text-white">~5 seconds</span>. Perfect for daily use.
              </p>
            </button>
          </div>

          {/* Full Sync */}
          <div className="space-y-2">
            <button
              onClick={() => {
                if (confirm('Full sync may take 2-3 minutes and processes all scrobbles. Continue?')) {
                  onFullSync();
                  onClose();
                }
              }}
              disabled={loading}
              className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/50 p-4 text-left transition-all hover:scale-[1.02] disabled:hover:scale-100"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                  <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Full Sync</h3>
                  <p className="text-xs text-purple-200">Use when Quick Sync isn't enough</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Syncs <span className="font-semibold text-white">all scrobbles</span> from battle start.
                Takes <span className="font-semibold text-white">2-3 minutes</span>. Use for catching up after long breaks.
              </p>
            </button>
          </div>

          {/* Info */}
          <div className="rounded-md bg-gray-800/50 border border-gray-700 p-3">
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-300">Auto-sync:</span> Scrobbles automatically sync within 15-30 minutes.
              Manual sync is optional for instant updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
