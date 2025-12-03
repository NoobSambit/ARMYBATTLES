'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() && !profileUrl.trim()) {
      setError('Please enter either your Last.fm username or profile URL');
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
        body: JSON.stringify({
          username: username.trim() || undefined,
          profileUrl: profileUrl.trim() || undefined
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
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
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-army-purple/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-bts-pink/20 rounded-full blur-3xl animate-float-delay" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-army-gold/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-bts-purple/10 to-transparent rounded-full animate-pulse-slow" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10 animate-slide-up">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden glow-pink animate-float">
            <Image
              src="https://res.cloudinary.com/dtamgk7i5/image/upload/v1764741224/armybattles-Picsart-BackgroundRemover_fd11rd.png"
              alt="ARMYBATTLES Logo"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black gradient-text-army mb-3">Join ARMYBATTLES</h1>
          <p className="text-gray-300 text-lg">Enter your Last.fm username to start competing</p>
        </div>

        <div className="card-premium p-8 sm:p-10 space-y-6 animate-scale-in">
          <p className="text-gray-300 text-center leading-relaxed">
            Enter your Last.fm username or profile URL to create your ARMY Battles profile. We'll automatically fetch your avatar and listening data. <span className="font-black text-white">No email or password required.</span>
          </p>

          {error && (
            <div className="bg-danger/10 border-2 border-danger/30 text-danger-light px-5 py-4 rounded-xl text-center font-semibold animate-slide-down glow-pink">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-200 mb-3 uppercase tracking-wider">
                Last.fm Username (Optional)
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
              <p className="text-xs text-gray-400 mt-2">
                This is the portion in your Last.fm URL: <span className="text-bts-pink-bright font-mono">last.fm/user/<strong>YourUsername</strong></span>
              </p>
            </div>

            <div className="text-center text-sm text-gray-400 font-semibold">OR</div>

            <div>
              <label htmlFor="profileUrl" className="block text-sm font-bold text-gray-200 mb-3 uppercase tracking-wider">
                Last.fm Profile URL (Optional)
              </label>
              <input
                type="url"
                id="profileUrl"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://www.last.fm/user/YourUsername"
                className="input-field"
                disabled={loading}
                autoComplete="url"
              />
              <p className="text-xs text-gray-400 mt-2">
                Your full Last.fm profile URL (e.g., <span className="text-bts-pink-bright font-mono">https://www.last.fm/user/NoobSambit</span>)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || (!username.trim() && !profileUrl.trim())}
              className="w-full btn-primary flex items-center justify-center py-4 text-lg"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="relative z-10 ml-3">Creating account...</span>
                </>
              ) : (
                <span className="relative z-10">Join the Battle</span>
              )}
            </button>
          </form>

          <div className="pt-6 border-t-2 border-border-light/50">
            <div className="text-center text-sm space-y-3">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-bts-pink-bright font-bold hover:text-bts-pink transition-colors hover:underline">
                  Log in here
                </Link>
              </p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
