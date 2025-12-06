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
    <nav className="sticky top-0 z-40 bg-panel/60 backdrop-blur-xl border-b border-border-light/50 shadow-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden glow-purple group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Image
                  src="https://res.cloudinary.com/dtamgk7i5/image/upload/v1764741224/armybattles-Picsart-BackgroundRemover_fd11rd.png"
                  alt="ARMYBATTLES Logo"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <span className="font-display tracking-tighter text-2xl font-black gradient-text-army drop-shadow-lg">ARMYBATTLES</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                isActive('/')
                  ? 'bg-gradient-to-r from-bts-purple/20 to-bts-pink/20 text-white border border-bts-purple/30 shadow-glow-purple'
                  : 'text-gray-300 hover:text-white hover:bg-panel-hover'
              )}
            >
              Home
            </Link>
            <Link
              href="/battles"
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                isActive('/battles')
                  ? 'bg-gradient-to-r from-bts-purple/20 to-bts-pink/20 text-white border border-bts-purple/30 shadow-glow-purple'
                  : 'text-gray-300 hover:text-white hover:bg-panel-hover'
              )}
            >
              Battles
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                  isActive('/dashboard')
                    ? 'bg-gradient-to-r from-bts-purple/20 to-bts-pink/20 text-white border border-bts-purple/30 shadow-glow-purple'
                    : 'text-gray-300 hover:text-white hover:bg-panel-hover'
                )}
              >
                Dashboard
              </Link>
            )}

            {!user ? (
              <div className="flex items-center space-x-3 ml-4">
                <Link href="/login">
                  <button className="px-5 py-2.5 text-sm font-semibold text-gray-200 hover:text-white transition-colors duration-300">
                    Login
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="btn-primary px-6 py-2.5 text-sm">Sign Up</button>
                </Link>
              </div>
            ) : (
              <div className="relative ml-4">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-panel-hover border border-transparent hover:border-border-light transition-all duration-300 group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-bts-purple to-bts-deep rounded-xl flex items-center justify-center text-white font-bold shadow-glow-purple group-hover:shadow-glow-purple-lg transition-all duration-300">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-200 font-medium">{user.displayName || user.username}</span>
                  <svg
                    className={cn(
                      'w-4 h-4 transition-transform duration-300',
                      showDropdown && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-64 bg-panel/95 backdrop-blur-xl rounded-2xl shadow-card-glow py-2 border border-border-light animate-slide-down overflow-hidden">
                    <div className="px-5 py-3 border-b border-border-light">
                      <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Signed in as</p>
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
          </div>

          <button
            onClick={() => setShowDonationModal(true)}
            className="px-4 py-2 text-sm font-bold bg-bts-pink hover:bg-bts-pink-bright text-white rounded-xl transition-all duration-300 shadow-lg shadow-bts-pink/50 hover:shadow-bts-pink/70 hover:scale-105"
          >
            DONATE
          </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-bts-pink focus:outline-none p-2 rounded-lg hover:bg-panel-hover transition-all duration-300"
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
        <div className="md:hidden border-t border-border-light bg-panel/95 backdrop-blur-xl animate-slide-down">
          <div className="px-3 pt-3 pb-4 space-y-2">
            <Link
              href="/"
              className={cn(
                'block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300',
                isActive('/')
                  ? 'bg-gradient-to-r from-bts-purple/20 to-bts-pink/20 text-white border border-bts-purple/30 shadow-glow-purple'
                  : 'text-gray-300 hover:bg-panel-hover hover:text-white'
              )}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/battles"
              className={cn(
                'block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300',
                isActive('/battles')
                  ? 'bg-gradient-to-r from-bts-purple/20 to-bts-pink/20 text-white border border-bts-purple/30 shadow-glow-purple'
                  : 'text-gray-300 hover:bg-panel-hover hover:text-white'
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
                  isActive('/dashboard')
                    ? 'bg-gradient-to-r from-bts-purple/20 to-bts-pink/20 text-white border border-bts-purple/30 shadow-glow-purple'
                    : 'text-gray-300 hover:bg-panel-hover hover:text-white'
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
                  className="block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:bg-panel-hover hover:text-white transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-bts-purple to-bts-deep text-white shadow-glow-purple transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  handleLogout().catch(() => {});
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
    <DonationModal isOpen={showDonationModal} onClose={() => setShowDonationModal(false)} />
    </>
  );
}
