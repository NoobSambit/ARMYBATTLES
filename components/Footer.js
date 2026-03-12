'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DisclaimerModal from './DisclaimerModal';

export default function Footer() {
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-slate-800 py-16 mt-20 bg-background-dark/80 backdrop-blur-sm z-40 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <Image
                src="/armybattles_logo.png"
                alt="ARMYBATTLES Logo"
                width={200}
                height={50}
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-[#D1D5DB] text-sm leading-relaxed">
              A fan-driven project built exclusively for BTS ARMY. Not a commercial product — just a platform to connect, scrobble, and support BTS together.
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Creator</span>
              <Link href="https://x.com/BoyWithLuvBytes" target="_blank" className="text-slate-400 hover:text-[#1DA1F2] transition-colors flex items-center gap-2 group w-fit">
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">link</span>
                <span className="text-sm font-bold">@BoyWithLuvBytes</span>
              </Link>
            </div>
          </div>
          <div>
            <h5 className="font-display text-white font-bold mb-6">Platform</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><Link href="/" className="hover:text-accent-cyan transition-colors">Home</Link></li>
              <li><Link href="/battles" className="hover:text-accent-cyan transition-colors">Battles</Link></li>
              <li><Link href="/dashboard" className="hover:text-accent-cyan transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-display text-white font-bold mb-6">Support</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><Link href="https://ko-fi.com/noobsambit" target="_blank" className="hover:text-accent-cyan transition-colors">Support on Ko-fi</Link></li>
              <li><Link href="https://x.com/BoyWithLuvBytes" target="_blank" className="hover:text-accent-cyan transition-colors">Contact Creator</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-display text-white font-bold mb-6">Legal</h5>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><button onClick={() => setDisclaimerOpen(true)} className="hover:text-accent-cyan transition-colors">Disclaimer</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-900 text-center">
          <p className="text-slate-500 text-xs leading-relaxed max-w-3xl mx-auto">
            © 2026 ARMYBATTLES. A non-profit fan project. <br className="hidden sm:block" />
            Not affiliated with, endorsed by, or connected to HYBE, BIGHIT MUSIC, BTS, or Last.fm in any way.
          </p>
        </div>
      </footer>

      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
      />
    </>
  );
}
