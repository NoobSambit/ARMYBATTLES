'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e) => {
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
        throw new Error(data.error || 'Failed to sign up');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('session_token', data.token);
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Join ARMY Battles</h1>
          <p className="text-gray-300">Enter your Last.fm username to start competing</p>
        </div>

        <div className="card p-8 space-y-6">
          <p className="text-gray-300 text-center">
            Enter your Last.fm username to create your ARMY Battles profile. We'll automatically fetch your avatar and listening data. No email or password required.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Last.fm Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your Last.fm username"
                className="w-full px-4 py-3 bg-surface-light border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bts-pink focus:border-transparent transition-all"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating account...</span>
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="text-bts-pink font-semibold hover:text-bts-purple transition-colors">
                Log in here
              </Link>
            </p>
            <p className="mt-3">
              Don't have a Last.fm account?{' '}
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
