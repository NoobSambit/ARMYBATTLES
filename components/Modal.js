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
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-all duration-400"
        onClick={onClose}
      />

      {/* Premium modal container */}
      <div className={cn(
        'relative bg-gradient-to-br from-panel-elevated via-panel to-panel-hover border-2 border-border-glow/30 rounded-3xl shadow-card-premium w-full max-h-[90vh] my-4 animate-scale-in overflow-hidden flex flex-col',
        sizeClasses[size]
      )}>
        {/* Animated gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-bts-purple via-bts-pink to-transparent animate-gradient-shift opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-bts-pink via-bts-purple to-transparent animate-gradient-shift opacity-70" />

        {/* Header with premium styling */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b-2 border-border-light/50 bg-panel/60 backdrop-blur-lg">
          <div>
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-black gradient-text-army mb-2">{title}</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-bts-purple to-bts-pink rounded-full shadow-glow" />
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
        <div className="px-6 sm:px-8 py-6 overflow-y-auto text-gray-100 custom-scrollbar flex-1 min-h-0">
          {children}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(10, 10, 15, 0.6);
          border-radius: 12px;
          margin: 8px 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(236, 72, 153, 0.6));
          border-radius: 12px;
          border: 2px solid rgba(19, 20, 29, 0.8);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(236, 72, 153, 0.9));
        }
      `}</style>
    </div>
  );
}
