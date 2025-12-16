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
    <Modal isOpen={isOpen} onClose={onClose} title="Battle Completed" size="md">
      <div className="space-y-6">
        {/* Trophy Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-bts-purple/10 border border-bts-purple/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-bts-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            Your Scorecard is Ready
          </h3>
          <p className="text-gray-300">
            View your personalized scorecard with your rank, score, and the full leaderboard
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleShareScorecard}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Scorecard
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-2 rounded-xl bg-panel-hover border border-border-light px-4 py-3 text-sm font-medium text-white transition-all hover:bg-panel-elevated hover:border-bts-purple/30"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </button>

            <button
              onClick={handleCopyScorecardLink}
              className="flex items-center justify-center gap-2 rounded-xl bg-panel-hover border border-border-light px-4 py-3 text-sm font-medium text-white transition-all hover:bg-panel-elevated hover:border-bts-pink/30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* URL Display */}
        <div className="rounded-xl bg-panel-hover border border-border-light p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-gray-400 mb-1">Scorecard URL</p>
              <p className="truncate text-sm text-white font-mono">{scorecardUrl}</p>
            </div>
            <button
              onClick={handleCopyScorecardLink}
              className="flex-shrink-0 rounded-lg bg-bts-purple hover:bg-bts-purple/80 px-4 py-2 text-xs font-medium text-white transition-colors"
            >
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-xl bg-panel-hover border border-border-light p-4">
          <h4 className="font-semibold text-white mb-3">How to share</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-bts-purple font-bold">1.</span>
              <span>Click "View Scorecard" to see your personalized results page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-bts-purple font-bold">2.</span>
              <span>Take a screenshot of the page or share the link directly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-bts-purple font-bold">3.</span>
              <span>Share on X, Instagram, or anywhere else</span>
            </li>
          </ul>
        </div>

        {/* Tip */}
        <div className="rounded-xl bg-bts-purple/10 border border-bts-purple/20 p-4">
          <p className="text-sm text-gray-300">
            <span className="text-white font-semibold">Tip:</span> Use the hashtag #ARMYBattles when sharing to help spread the word
          </p>
        </div>
      </div>
    </Modal>
  );
}
