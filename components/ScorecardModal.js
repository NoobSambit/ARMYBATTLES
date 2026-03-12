'use client';

import { useState } from 'react';
import Modal from './Modal';

export default function ScorecardModal({ battle, currentUser, isOpen, onClose, userStats }) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const scorecardUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/scorecard/${battle._id}/${currentUser.id || currentUser._id}`;

  const handleShareScorecard = () => {
    window.open(scorecardUrl, '_blank');
  };

  const handleCopyScorecardLink = () => {
    navigator.clipboard.writeText(scorecardUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareTwitter = () => {
    const rank = userStats?.rank || '[RANK]';
    const scrobbles = userStats?.scrobbles || userStats?.score || '[SCROBBLES]';
    const tweetText = `Just finished the ${battle.name} Streaming Battle in armybattles.netlify.app!\nRanked #${rank} with ${scrobbles} scrobbles 🏆\n\nCheck it out:\n${scorecardUrl}\n\n#BTS #ARMYBattles #StreamBattles\nCreator: @Boy_With_Code`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Battle Completed">
      <div className="space-y-6 pt-2">
        {/* Trophy / Emblem Icon */}
        <div className="flex justify-center relative">
          <div className="absolute inset-0 bg-[#c77dff]/20 blur-[50px] rounded-full pointer-events-none w-32 h-32 mx-auto"></div>
          <div className="relative w-24 h-24 rounded-2xl bg-black/50 border-2 border-[#c77dff]/40 flex items-center justify-center shadow-[0_0_30px_rgba(157,78,221,0.3)] animate-float">
            <span className="material-symbols-outlined text-[3.5rem] text-[#e0aaff]">workspace_premium</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center">
          <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 tracking-tight mb-2">
            Your Scorecard is Ready
          </h3>
          <p className="text-gray-400 font-medium">
            View your personalized scorecard with your rank, score, and the full leaderboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          <button
            onClick={handleShareScorecard}
            className="group relative w-full overflow-hidden bg-[#7b2cbf]/20 text-[#e0aaff] hover:text-white border border-[#7b2cbf]/50 hover:border-[#c77dff] font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(123,44,191,0.15)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(157,78,221,0.3)] hover:-translate-y-1"
          >
            <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#7b2cbf]/80 to-[#5a189a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>
            <span className="relative z-10 flex items-center justify-center gap-3 tracking-widest uppercase text-base">
              <span className="material-symbols-outlined text-xl">open_in_new</span>
              VIEW SCORECARD
            </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShareTwitter}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-black/40 border border-white/10 px-4 py-4 text-sm font-bold text-gray-300 transition-all hover:bg-white/5 hover:border-gray-500 hover:text-white hover:-translate-y-1 shadow-lg"
            >
              <svg className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              SHARE ON X
            </button>

            <button
              onClick={handleCopyScorecardLink}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-black/40 border border-white/10 px-4 py-4 text-sm font-bold text-gray-300 transition-all hover:bg-white/5 hover:border-[#7b2cbf]/50 hover:text-[#e0aaff] hover:-translate-y-1 shadow-lg"
            >
              <span className="material-symbols-outlined text-[24px] text-gray-400 group-hover:text-[#c77dff] transition-colors">{copiedLink ? 'task_alt' : 'link'}</span>
              {copiedLink ? 'COPIED' : 'COPY LINK'}
            </button>
          </div>
        </div>

        {/* URL Display */}
        <div className="rounded-xl bg-black/60 border border-white/5 p-4 mt-2">
          <div className="flex items-center gap-4">
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black tracking-widest text-[#7b2cbf] mb-1.5 uppercase">SCORECARD URL</p>
              <p className="truncate text-sm text-gray-300 font-mono tracking-wider">{scorecardUrl}</p>
            </div>
            <button
              onClick={handleCopyScorecardLink}
              className="flex-shrink-0 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-xs font-bold text-white transition-all uppercase tracking-wider"
            >
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-xl bg-black/40 border border-white/10 p-5">
          <h4 className="font-black text-white mb-3 text-sm uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[#c77dff] text-base">info</span>
            How To Share
          </h4>
          <ul className="space-y-3 text-sm text-gray-400 font-medium">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7b2cbf]/20 text-[#e0aaff] flex items-center justify-center text-xs font-bold border border-[#7b2cbf]/30">1</span>
              <span>Click "VIEW SCORECARD" to see your personalized results page.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7b2cbf]/20 text-[#e0aaff] flex items-center justify-center text-xs font-bold border border-[#7b2cbf]/30">2</span>
              <span>Take a screenshot of the page or share the link directly.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7b2cbf]/20 text-[#e0aaff] flex items-center justify-center text-xs font-bold border border-[#7b2cbf]/30">3</span>
              <span>Share your results with other ARMYs on X or Instagram!</span>
            </li>
          </ul>
        </div>

        {/* Tip */}
        <div className="rounded-xl bg-gradient-to-r from-[#7b2cbf]/5 to-transparent border-l-2 border-[#7b2cbf] p-4 flex gap-3">
          <span className="material-symbols-outlined text-[#e0aaff]">lightbulb</span>
          <p className="text-sm text-gray-300 font-medium leading-relaxed">
            Attach <span className="text-[#c77dff] font-bold">#ARMYBattles</span> when posting to share your score with others.
          </p>
        </div>
      </div>
    </Modal>
  );
}
