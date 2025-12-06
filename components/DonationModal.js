'use client';

import Modal from './Modal';
import Link from 'next/link';

export default function DonationModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Support ARMYBATTLES" size="md">
      <div className="space-y-6">
        <div className="space-y-4 text-gray-200 leading-relaxed">
          <p>
            I'm a student developer running this site entirely on my own, with no income source to cover server and platform costs.
          </p>
          
          <p>
            Hosting services often go above their free limits, and keeping the site online typically costs around $20/month (excluding costs of other services like database). Without support, I may not be able to keep the servers running once the free tier is exhausted.
          </p>
          
          <p>
            If you enjoy this project and want to help keep it alive for ARMY, any contribution—no matter the amount—truly helps. Your support directly goes into maintaining the site, upgrading features, and ensuring it stays free for everyone.
          </p>
          
          <p className="text-bts-purple font-semibold">
            Thank you so much for helping me continue this journey. 💜
          </p>
        </div>

        <div className="pt-4 border-t border-border-light">
          <Link
            href="https://ko-fi.com/noobsambit"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <button className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-3 group">
              <svg 
                className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Donate on Ko-fi
              <svg 
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}

