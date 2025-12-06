'use client';

import { useState } from 'react';
import { XMarkIcon, ShareIcon } from '@heroicons/react/24/outline';

export default function ScorecardModal({ battle, currentUser, isOpen, onClose }) {
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
    const tweetText = `Just finished the ${battle.name} battle! 🎵\n\nCheck out my scorecard: ${scorecardUrl}\n#BTS #ARMYBattles #StreamBattles`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-br from-purple-900 to-pink-900 p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Battle Completed! 🎉</h2>
              <p className="mt-2 text-sm text-gray-300">Share your results with the world</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Scorecard Preview Card */}
            <div className="rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-500/50 p-6">
              <div className="mb-4 text-center">
                <div className="mb-2 text-6xl">🏆</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Your Battle Scorecard is Ready!
                </h3>
                <p className="text-sm text-gray-300">
                  View your personalized scorecard page with your rank, score, and the full leaderboard
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  onClick={handleShareScorecard}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-medium text-white transition-all hover:from-purple-700 hover:to-pink-700 hover:shadow-lg"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Scorecard
                </button>

                <button
                  onClick={handleShareTwitter}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on Twitter
                </button>

                <button
                  onClick={handleCopyScorecardLink}
                  className="flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-700"
                >
                  <ShareIcon className="h-5 w-5" />
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              {/* URL Display */}
              <div className="mt-4 rounded-lg bg-black/30 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-xs text-gray-400">Scorecard URL:</p>
                    <p className="truncate text-sm text-white">{scorecardUrl}</p>
                  </div>
                  <button
                    onClick={handleCopyScorecardLink}
                    className="flex-shrink-0 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    {copiedLink ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-lg bg-white/10 p-4">
              <h4 className="mb-2 font-semibold text-white">How to share:</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">1.</span>
                  <span>Click "View Scorecard" to see your personalized results page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">2.</span>
                  <span>Take a screenshot of the page (or share the link directly)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">3.</span>
                  <span>Share on Twitter, Instagram, or anywhere else!</span>
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div className="rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 p-4">
              <p className="text-sm text-gray-300">
                <strong className="text-white">Tip:</strong> Use the hashtag #ARMYBattles when sharing to help spread the word about our BTS streaming battles!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
