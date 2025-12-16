'use client';

import { useState } from 'react';
import Link from 'next/link';
import DisclaimerModal from './DisclaimerModal';

export default function Footer() {
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border-light/30 bg-panel/40 backdrop-blur-lg mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span>Created by</span>
              <Link
                href="https://x.com/Boy_With_Code"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-bts-pink hover:text-bts-pink-bright transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @Boy_With_Code
              </Link>
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button
                onClick={() => setDisclaimerOpen(true)}
                className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Disclaimer
              </button>
              <Link
                href="https://ko-fi.com/noobsambit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-bts-pink transition-colors"
              >
                Support on Ko-fi
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
      />
    </>
  );
}
