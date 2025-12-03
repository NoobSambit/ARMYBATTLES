'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Login() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim()) {
      setError('Please enter your Last.fm username');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/username-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // Store token and user data in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to home page
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-bts-purple/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-bts-pink/20 rounded-full blur-3xl animate-float-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-army-purple/10 to-transparent rounded-full animate-pulse-slow" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10 animate-slide-up">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-bts-purple to-bts-pink glow-purple animate-float">
            <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black gradient-text-army mb-3">Welcome Back</h1>
          <p className="text-gray-300 text-lg">Log in to join the streaming battles</p>
        </div>

        <div className="card-premium p-8 sm:p-10 space-y-6 animate-scale-in">
          <p className="text-gray-300 text-center">
            Enter your Last.fm username to login and track your scrobbles. We'll fetch your listening data to power the battles.
          </p>

          {error && (
            <div className="bg-danger/10 border-2 border-danger/30 text-danger-light px-5 py-4 rounded-xl text-center font-semibold animate-slide-down glow-pink">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-200 mb-3 uppercase tracking-wider">
                Last.fm Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your Last.fm username"
                className="input-field"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full btn-primary flex items-center justify-center py-4 text-lg"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="relative z-10 ml-3">Logging in...</span>
                </>
              ) : (
                <span className="relative z-10">Login to Battle</span>
              )}
            </button>
          </form>

          <div className="pt-6 border-t-2 border-border-light/50">
            <div className="text-center text-sm space-y-3">
              <p className="text-gray-400">
                Don't have a Last.fm account?{' '}
                <a
                  href="https://www.last.fm/join"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bts-pink-bright font-bold hover:text-bts-pink transition-colors hover:underline"
                >
                  Create one for free
                </a>
              </p>
              <p className="text-gray-400">
                New to ARMYBATTLES?{' '}
                <Link href="/signup" className="text-bts-pink-bright font-bold hover:text-bts-pink transition-colors hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
