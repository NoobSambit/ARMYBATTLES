'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SignUp() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data && e.data.type === 'login-complete') {
        window.location.href = '/dashboard';
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleConnect = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/lastfm-start', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start Last.fm signup');
      }

      if (!data.authorizeUrl) {
        throw new Error('Invalid response from Last.fm signup');
      }

      const popup = window.open(
        data.authorizeUrl,
        'lastfm-auth',
        'width=520,height=700,menubar=no,toolbar=no,status=no,location=no'
      );
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = data.authorizeUrl;
      }
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
          <h1 className="text-4xl font-bold text-gradient mb-2">Join ARMY Battles</h1>
          <p className="text-gray-300">Connect your Last.fm account to start competing</p>
        </div>

        <div className="card p-8 space-y-6">
          <p className="text-gray-300">
            When you connect with Last.fm we create your ARMY Battles profile automatically using your Last.fm username and avatar. No email or password required.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
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
              Already connected before?{' '}
              <Link href="/login" className="text-bts-pink font-semibold hover:text-bts-purple transition-colors">
                Log in here
              </Link>
            </p>
            <p className="mt-3">
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
          </div>
        </div>
      </div>
    </div>
  );
}
