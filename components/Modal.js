'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto" style={{ position: 'fixed' }}>
      {/* Premium backdrop with enhanced blur */}
      <div
        className="absolute inset-0 bg-[#000000]/85 backdrop-blur-xl transition-all duration-400"
        onClick={onClose}
      />

      {/* Premium modal container */}
      <div className={cn(
        'relative bg-[#090b14] border border-[#7b2cbf]/30 rounded-3xl shadow-[0_0_40px_rgba(157,78,221,0.2)] w-full max-h-[90vh] my-4 animate-scale-in overflow-hidden flex flex-col',
        sizeClasses[size]
      )}>
        {/* Animated gradient border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c77dff] to-transparent opacity-50" />

        {/* Subtle glow behind title */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#7b2cbf]/10 blur-[60px] pointer-events-none" />

        {/* Header with premium styling */}
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-white/[0.05] bg-transparent">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#f3e8ff] via-[#d8b4fe] to-[#9333ea] mb-1.5 tracking-tight drop-shadow-sm">{title}</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-[#c77dff] to-[#5a189a] rounded-full shadow-[0_0_10px_rgba(157,78,221,0.5)]" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-300 p-2.5 rounded-xl hover:bg-panel-hover hover:rotate-90 hover:scale-110 transform group"
          >
            <svg className="w-6 h-6 group-hover:drop-shadow-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content area with premium scrollbar */}
        <div className="relative z-10 px-6 sm:px-8 py-6 pb-8 overflow-y-auto text-gray-100 custom-scrollbar flex-1 min-h-0">
          {children}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(9, 11, 20, 0.8);
          border-radius: 12px;
          margin: 8px 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(157, 78, 221, 0.4), rgba(90, 24, 154, 0.4));
          border-radius: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(157, 78, 221, 0.8), rgba(90, 24, 154, 0.8));
        }
      `}</style>
    </div>
  );
}
