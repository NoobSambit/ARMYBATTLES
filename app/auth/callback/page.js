'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    const completeLogin = async () => {
      try {
        const res = await fetch('/api/auth/lastfm-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(token ? { token } : {}),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to complete Last.fm login');
        }

        if (!data.token || !data.user) {
          throw new Error('Invalid login response');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'login-complete' }, window.location.origin);
          }
        } catch (e) {}

        if (window.opener && !window.opener.closed) {
          window.close();
        } else {
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('Last.fm login failed:', err);
        setError(err.message);
      }
    };

    completeLogin();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-surface">
        <div className="max-w-md w-full card p-8 text-center">
          <h1 className="text-2xl font-bold text-red-300 mb-4">Login Failed</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="btn-primary w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-surface">
      <div className="flex flex-col items-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-300">Completing Last.fm login...</p>
      </div>
    </div>
  );
}

export default function LastfmCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-surface">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-300">Completing Last.fm login...</p>
          </div>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
