'use client';

import { useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/lastfm-start', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start Last.fm login');
      }

      if (!data.authorizeUrl) {
        throw new Error('Invalid response from Last.fm login');
      }

      window.location.href = data.authorizeUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Welcome Back</h1>
          <p className="text-gray-300">Log in to join the streaming battles</p>
        </div>

        <div className="card p-8 space-y-6">
          <p className="text-gray-300 text-center">
            We use your Last.fm account to identify you and track your scrobbles. No passwords to remember—just connect and start competing.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Connecting to Last.fm...</span>
              </>
            ) : (
              'Continue with Last.fm'
            )}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>
              Need a Last.fm account?{' '}
              <a
                href="https://www.last.fm/join"
                target="_blank"
                rel="noopener noreferrer"
                className="text-bts-pink font-semibold hover:text-bts-purple transition-colors"
              >
                Create one for free
              </a>
            </p>
            <p className="mt-3">
              Looking to create an account?{' '}
              <Link href="/signup" className="text-bts-pink font-semibold hover:text-bts-purple transition-colors">
                Go to Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
