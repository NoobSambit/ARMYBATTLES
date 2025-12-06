'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border-light/30 bg-panel/40 backdrop-blur-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-4">
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
  );
}
