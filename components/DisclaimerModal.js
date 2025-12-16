'use client';

import Modal from './Modal';

export default function DisclaimerModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Disclaimer" size="md">
      <div className="space-y-6 text-gray-300">
        {/* Main disclaimer */}
        <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-3">Independent Fan Project</h3>
              <p className="text-sm leading-relaxed">
                <strong className="text-purple-300">ARMYBATTLES</strong> is an independent, fan-made platform created by an ARMY for the ARMY community.
                This project is <strong className="text-purple-300">not affiliated with, endorsed by, or connected to</strong> HYBE Corporation, Big Hit Music, BTS, or any of their official entities.
              </p>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className="space-y-3">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-pink-400">💜</span>
            Our Purpose
          </h4>
          <p className="text-sm leading-relaxed pl-7">
            This platform was created as a fun, engaging way to bring the ARMY community together through friendly streaming competitions.
            We celebrate our love for BTS's music by making streaming more interactive and social.
          </p>
        </div>

        {/* What we are */}
        <div className="space-y-3">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-pink-400">🎵</span>
            What We Do
          </h4>
          <ul className="text-sm space-y-2 pl-7 list-disc list-outside">
            <li>Create friendly streaming competitions for ARMY</li>
            <li>Track Last.fm scrobbles for participating users</li>
            <li>Foster community engagement and friendly competition</li>
            <li>Make streaming BTS music more fun and rewarding</li>
          </ul>
        </div>

        {/* What we don't do */}
        <div className="space-y-3">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-pink-400">⚠️</span>
            What We Don't Do
          </h4>
          <ul className="text-sm space-y-2 pl-7 list-disc list-outside">
            <li>We do <strong>not</strong> stream music on your behalf</li>
            <li>We do <strong>not</strong> manipulate streaming numbers</li>
            <li>We do <strong>not</strong> access your Spotify account or data</li>
            <li>We do <strong>not</strong> represent or speak for BTS or HYBE</li>
          </ul>
        </div>

        {/* Trademarks */}
        <div className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-5">
          <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Trademarks & Copyright</h4>
          <p className="text-xs leading-relaxed text-gray-400">
            BTS, the BTS logo, and all related names, characters, and distinctive likenesses are trademarks of HYBE Corporation and Big Hit Music.
            All music, images, and other copyrighted materials belong to their respective owners. This platform uses publicly available information
            from Last.fm and Spotify for tracking purposes only.
          </p>
        </div>

        {/* Community spirit */}
        <div className="bg-gradient-to-r from-purple-950/30 to-pink-950/30 border border-purple-500/20 rounded-xl p-6 text-center">
          <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            Made with 💜 by ARMY, for ARMY
          </p>
          <p className="text-sm text-gray-400">
            A passion project to make our streaming experience more engaging and community-driven
          </p>
        </div>

        {/* Contact info */}
        <div className="text-center pt-4 border-t border-gray-700/30">
          <p className="text-xs text-gray-500">
            Questions or concerns? Reach out to us on{' '}
            <a
              href="https://x.com/Boy_With_Code"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors underline"
            >
              Twitter
            </a>
          </p>
        </div>
      </div>
    </Modal>
  );
}
