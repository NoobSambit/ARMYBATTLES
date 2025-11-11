'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const isActive = (path) => pathname === path;

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gradient">ARMY Stream Battles</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={cn(
                'text-gray-700 hover:text-army-purple transition-colors',
                isActive('/') && 'text-army-purple font-semibold'
              )}
            >
              Home
            </Link>
            <Link
              href="/battles"
              className={cn(
                'text-gray-700 hover:text-army-purple transition-colors',
                isActive('/battles') && 'text-army-purple font-semibold'
              )}
            >
              Battles
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className={cn(
                  'text-gray-700 hover:text-army-purple transition-colors',
                  isActive('/dashboard') && 'text-army-purple font-semibold'
                )}
              >
                Dashboard
              </Link>
            )}

            {!user ? (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <button className="px-4 py-2 text-army-purple hover:text-army-purple-dark transition-colors">
                    Login
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="btn-primary">Sign Up</button>
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-purple rounded-full flex items-center justify-center text-white font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700">{user.username}</span>
                  <svg
                    className={cn(
                      'w-4 h-4 transition-transform',
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm text-gray-600">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-army-purple focus:outline-none"
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
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={cn(
                'block px-3 py-2 rounded-md text-base font-medium',
                isActive('/') ? 'bg-army-purple text-white' : 'text-gray-700 hover:bg-gray-100'
              )}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/battles"
              className={cn(
                'block px-3 py-2 rounded-md text-base font-medium',
                isActive('/battles') ? 'bg-army-purple text-white' : 'text-gray-700 hover:bg-gray-100'
              )}
              onClick={() => setIsOpen(false)}
            >
              Battles
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className={cn(
                  'block px-3 py-2 rounded-md text-base font-medium',
                  isActive('/dashboard') ? 'bg-army-purple text-white' : 'text-gray-700 hover:bg-gray-100'
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
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-army-purple text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
