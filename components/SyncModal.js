'use client';

export default function SyncModal({ isOpen, onClose, onQuickSync, onFullSync, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#000000]/85 backdrop-blur-xl animate-fade-in transition-all duration-400"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-md bg-[#090b14] border border-[#7b2cbf]/30 rounded-3xl shadow-[0_0_40px_rgba(157,78,221,0.2)] overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c77dff] to-transparent opacity-50" />

        {/* Subtle glow behind title */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#7b2cbf]/10 blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.05] bg-transparent">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#f3e8ff] via-[#d8b4fe] to-[#9333ea] mb-1 tracking-tight drop-shadow-sm">
              Sync Scrobbles
            </h2>
            <div className="h-1 w-12 bg-gradient-to-r from-[#c77dff] to-[#5a189a] rounded-full shadow-[0_0_10px_rgba(157,78,221,0.5)]" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/5 hover:rotate-90 hover:scale-110 transform group"
          >
            <span className="material-symbols-outlined group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 sm:px-8 py-6 pb-8 space-y-5">
          {/* Quick Sync */}
          <button
            onClick={() => {
              onQuickSync();
              onClose();
            }}
            disabled={loading}
            className="w-full text-left group relative bg-gradient-to-r from-[#12081c]/95 via-[#130a1d]/92 to-black/70 border border-[#c77dff]/25 hover:border-[#c77dff]/55 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_0_24px_rgba(199,125,255,0.18)] hover:-translate-y-1 block disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#c77dff]/8 via-[#7b2cbf]/8 to-transparent group-hover:from-[#c77dff]/12 group-hover:via-[#7b2cbf]/12 transition-all duration-500 rounded-2xl pointer-events-none" />
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#c77dff]/20 via-transparent to-transparent opacity-70 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-[#c77dff]/20 group-hover:border-[#c77dff]/45 flex items-center justify-center flex-shrink-0 transition-colors shadow-[0_0_18px_rgba(199,125,255,0.08)]">
                  <span className="material-symbols-outlined text-[#d8b4fe] group-hover:text-[#f3e8ff] text-2xl transition-colors">bolt</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-200 group-hover:text-white tracking-wide transition-colors">Quick Sync</h3>
                  <p className="text-xs text-[#c77dff] font-bold uppercase tracking-widest mt-0.5">Best for most syncs</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">
                Checks your most recent scrobbles and updates fast.
                Usually <span className="font-bold text-gray-200">the right choice for routine catch-up</span>, handling about <span className="font-bold text-gray-200">your latest 800 scrobbles</span> in <span className="font-bold text-[#e0aaff]">~5s</span>.
              </p>
            </div>
          </button>

          {/* Full Sync */}
          <button
            onClick={() => {
              if (confirm('Full sync processes all your scrobbles and takes longer. Continue?')) {
                onFullSync();
                onClose();
              }
            }}
            disabled={loading}
            className="w-full text-left group relative bg-black/40 border border-white/5 hover:border-[#9d4edd]/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(157,78,221,0.15)] hover:-translate-y-1 block disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd]/0 to-[#9d4edd]/5 group-hover:to-[#9d4edd]/20 transition-all duration-500 rounded-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 group-hover:border-[#9d4edd]/40 flex items-center justify-center flex-shrink-0 transition-colors">
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-[#e0aaff] text-2xl transition-colors">radar</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-200 group-hover:text-white tracking-wide transition-colors">Full Sync</h3>
                  <p className="text-xs text-[#e0aaff] font-bold uppercase tracking-widest mt-0.5">Recovery only</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">
                Scans your <span className="font-bold text-gray-200">entire battle history</span> and can take <span className="font-bold text-[#e0aaff]">2-3m</span>.
                Use only if quick sync missed older scrobbles.
              </p>
            </div>
          </button>

          {/* Info */}
          <div className="rounded-xl border border-white/5 bg-black/50 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-[#7b2cbf]/10 blur-[20px]"></div>
            <p className="text-xs text-gray-400 font-medium leading-relaxed uppercase tracking-wide">
              <span className="font-black text-[#e0aaff] mr-2">AUTO-SYNC:</span> Counts usually refresh automatically within 15-30 mins, so manual sync is mainly for faster updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
