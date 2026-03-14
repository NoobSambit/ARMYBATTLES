'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import DonationModal from './DonationModal';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check localStorage on mount and whenever pathname changes
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      setUser(null);
    }

    const handleStorage = (event) => {
      if (event.key === 'user') {
        if (event.newValue) {
          try {
            setUser(JSON.parse(event.newValue));
          } catch (error) {
            console.error('Failed to parse user data:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      if (event.key === 'token' && !event.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [pathname]);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');

    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
      }
    } catch (err) {
      console.error('Failed to log out:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  };

  const isActive = (path) => pathname === path;

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/armybattles_logo.png"
                alt="ARMYBATTLES Logo"
                width={40}
                height={40}
                className="h-8 w-8 object-contain"
                priority
              />
              <span className="font-display text-xs sm:text-base font-black tracking-[0.1em] sm:tracking-[0.18em] text-white">
                ARMYBATTLES
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={cn(
                'text-sm font-medium transition-colors',
                isActive('/') ? 'text-accent-cyan' : 'hover:text-accent-cyan'
              )}
            >
              Home
            </Link>
            <Link
              href="/battles"
              className={cn(
                'text-sm font-medium transition-colors',
                isActive('/battles') ? 'text-accent-cyan' : 'hover:text-accent-cyan'
              )}
            >
              Battles
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive('/dashboard') ? 'text-accent-cyan' : 'hover:text-accent-cyan'
                )}
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <Link href="/login" className="hidden sm:block text-sm font-medium hover:text-accent-cyan transition-colors">Login</Link>
                <Link href="/signup">
                  <button className="bg-accent-magenta hover:bg-opacity-90 text-white px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm neon-magenta-glow transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[14px] sm:text-sm hidden sm:block">music_note</span>
                    Sign Up
                  </button>
                </Link>
              </>
            ) : (
              <div className="relative flex items-center gap-4">
                <button
                  onClick={() => setShowDonationModal(true)}
                  className="hidden sm:block text-sm font-medium hover:text-accent-cyan transition-colors"
                >
                  Donate
                </button>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-primary/50 overflow-hidden bg-gradient-to-br from-bts-purple to-bts-deep flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-12 mt-2 w-64 glass-card rounded-2xl shadow-2xl py-2 animate-slide-down overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Signed in as</p>
                      <p className="text-sm font-bold text-white">{user.username}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-300 hover:text-accent-cyan focus:outline-none p-2 transition-all duration-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-white/10 bg-background-dark/95 backdrop-blur-xl animate-slide-down">
            <div className="px-3 pt-3 pb-4 space-y-2">
              <Link
                href="/"
                className={cn(
                  'block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300',
                  isActive('/') ? 'bg-primary/20 text-accent-cyan' : 'text-gray-300 hover:bg-white/5'
                )}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/battles"
                className={cn(
                  'block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300',
                  isActive('/battles') ? 'bg-primary/20 text-accent-cyan' : 'text-gray-300 hover:bg-white/5'
                )}
                onClick={() => setIsOpen(false)}
              >
                Battles
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className={cn(
                    'block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300',
                    isActive('/dashboard') ? 'bg-primary/20 text-accent-cyan' : 'text-gray-300 hover:bg-white/5'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {!user ? (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:bg-white/5 transition-all duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                </>
              ) : null}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowDonationModal(true);
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:bg-white/5 transition-all duration-300"
              >
                Donate
              </button>
            </div>
          </div>
        )}
      </nav>
      <DonationModal isOpen={showDonationModal} onClose={() => setShowDonationModal(false)} />
    </>
  );
}
