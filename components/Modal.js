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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Enhanced backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* Enhanced modal container */}
      <div className={cn(
        'relative bg-gradient-to-br from-panel to-panel-hover border border-border-light rounded-2xl shadow-card-glow w-full animate-scale-in overflow-hidden',
        sizeClasses[size]
      )}>
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bts-purple to-transparent" />

        {/* Header with enhanced styling */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border-light bg-panel/50 backdrop-blur-sm">
          <div>
            <h2 className="font-display text-2xl font-bold text-white mb-1">{title}</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-bts-purple to-bts-pink rounded-full" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-panel-hover hover:rotate-90 transform"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content area with custom scrollbar */}
        <div className="px-8 py-6 max-h-[calc(100vh-250px)] overflow-y-auto text-gray-100 custom-scrollbar">
          {children}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(19, 20, 29, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
}
