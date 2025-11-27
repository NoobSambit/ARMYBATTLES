import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative bg-gradient-to-b from-panel via-surface to-surface overflow-hidden border-b border-border-light">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-bts-purple/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-bts-pink/20 rounded-full blur-3xl animate-float-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-bts-purple/10 to-transparent rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          {/* Main title with gradient */}
          <div className="mb-6 animate-slide-up">
            <h1 className="hero-title text-gradient mb-4">
              ARMYBATTLES
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-bts-purple to-transparent" />
              <span className="text-sm font-semibold text-accent uppercase tracking-widest">
                Compete • Stream • Win
              </span>
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-bts-pink to-transparent" />
            </div>
          </div>

          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up font-light">
            Compete with <span className="text-gradient font-semibold">ARMY</span> worldwide. Real verified streams, real winners.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up">
            <Link href="/dashboard">
              <button className="btn-primary text-lg px-10 py-4 shadow-glow-purple-lg font-bold w-full sm:w-auto">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Host a Battle
                </span>
              </button>
            </Link>
            <Link href="/battles">
              <button className="btn-secondary text-lg px-10 py-4 font-bold w-full sm:w-auto">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Join a Battle
                </span>
              </button>
            </Link>
          </div>

          {/* Feature cards with enhanced styling */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="card-glass p-8 animate-scale-in hover:scale-105 transition-transform duration-400">
              <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-bts-purple/20 to-bts-deep/20 border border-bts-purple/30 shadow-glow-purple">
                <svg className="w-7 h-7 text-bts-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">Real Streams</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Verified through Last.fm scrobbles for authenticity</p>
            </div>

            <div className="card-glass p-8 animate-scale-in hover:scale-105 transition-transform duration-400 delay-75">
              <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-bts-pink/20 to-bts-pink-light/20 border border-bts-pink/30 shadow-glow-pink">
                <svg className="w-7 h-7 text-bts-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">Live Updates</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Real-time leaderboards refresh every 30 seconds</p>
            </div>

            <div className="card-glass p-8 animate-scale-in hover:scale-105 transition-transform duration-400 delay-150">
              <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-army-purple-light/20 border border-accent/30">
                <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">Fair Competition</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Automatic detection and consistent verification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
