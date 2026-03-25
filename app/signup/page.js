'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getTrackingServiceConfig } from '@/lib/tracking-services';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const serviceConfig = getTrackingServiceConfig('lastfm');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() && !profileUrl.trim()) {
      setError(`Please enter either your ${serviceConfig.label} username or profile URL`);
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
          service: 'lastfm',
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background-dark text-slate-100 font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent-magenta/10 rounded-full blur-[150px] pointer-events-none"></div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCInPjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-50 z-0"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 mx-auto">
        <div className="glass-card rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(0,240,255,0.1)] border border-white/10 relative overflow-hidden">

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent-cyan to-accent-magenta"></div>

          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/30 mb-6 group hover:bg-accent-cyan/20 transition-all hover:scale-105">
              <span className="material-symbols-outlined text-4xl text-accent-cyan group-hover:text-white transition-colors">person_add</span>
            </Link>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f0ff] mb-3 tracking-tight">
              CREATE ACCOUNT
            </h1>
            <p className="text-[#D1D5DB] text-sm">Join ARMYBATTLES with your Last.fm account</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Enter your Last.fm username or profile URL below. We will automatically fetch your public profile details. <br /><span className="text-white font-bold tracking-widest uppercase mt-1 block">No password required.</span>
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl text-center font-bold text-sm tracking-wide">
                <span className="material-symbols-outlined align-middle mr-2 text-[18px]">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                <p className="font-bold">{serviceConfig.description}</p>
                <p className="text-xs uppercase tracking-widest mt-1 opacity-80">{serviceConfig.battleSupportNote}</p>
                <p className="mt-2 text-xs text-slate-200/80">One tracker is allowed per account.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">account_circle</span> {serviceConfig.usernameLabel}
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={serviceConfig.usernamePlaceholder}
                    className="w-full bg-background-dark/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all font-mono text-sm"
                    disabled={loading}
                    autoComplete="username"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-cyan to-primary opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none -z-10 blur-sm"></div>
                </div>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-black text-slate-500 uppercase tracking-widest">OR USE PROFILE URL</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="space-y-2">
                <label htmlFor="profileUrl" className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">link</span> Profile URL
                </label>
                <div className="relative group">
                  <input
                    type="url"
                    id="profileUrl"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    placeholder={serviceConfig.profileUrlPlaceholder}
                    className="w-full bg-background-dark/50 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                    disabled={loading}
                    autoComplete="url"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent-magenta opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none -z-10 blur-sm"></div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (!username.trim() && !profileUrl.trim())}
                className="w-full bg-accent-cyan text-background-dark hover:bg-white py-4 rounded-xl font-black uppercase tracking-wider text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>CREATING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <span>JOIN THE BATTLE</span>
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-8 mt-8 border-t border-white/10 flex flex-col items-center gap-4 text-sm">
              <p className="text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-bold hover:text-white transition-colors">
                  Log In
                </Link>
              </p>
              <p className="text-slate-500 text-xs text-center max-w-[280px]">
                Requires an active <a href={serviceConfig.profileHelpUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{serviceConfig.profileHelpLabel}</a> account to track your streaming progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
