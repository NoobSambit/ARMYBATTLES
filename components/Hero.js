import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <div className="relative bg-gradient-to-b from-surface-elevated via-surface to-surface-dark overflow-hidden border-b-2 border-border-glow/20">
      {/* Enhanced Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] bg-gradient-to-br from-bts-purple/30 to-army-purple/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-gradient-to-br from-bts-pink/30 to-bts-pink-bright/20 rounded-full blur-3xl animate-float-delay" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-army-gold/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-bts-purple/15 via-bts-pink/10 to-transparent rounded-full animate-pulse-slow" />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Mobile Layout - Vertical Stack */}
        <div className="lg:hidden flex flex-col items-center">
          {/* Logo Image with Overlaid Content */}
          <div className="relative animate-slide-up mb-40 w-full max-w-lg">
            <div className="relative w-full aspect-square">
              <Image
                src="https://res.cloudinary.com/dtamgk7i5/image/upload/v1764741224/armybattles-Picsart-BackgroundRemover_fd11rd.png"
                alt="ARMY Battles Logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>

            {/* Overlaid Title and Buttons Box - positioned lower, extending below logo */}
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[85%] max-w-md bg-[#1a0a24] rounded-2xl border-2 border-bts-purple/50 shadow-2xl p-5 sm:p-6">
              <div className="text-center">
                <div className="mb-3 animate-slide-up">
                  <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-bts-pink-bright to-white drop-shadow-glow mb-2">
                    ARMYBATTLES
                  </h1>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-0.5 w-6 bg-gradient-to-r from-transparent via-white to-bts-pink-bright rounded-full" />
                    <span className="text-[0.55rem] sm:text-xs font-black text-white uppercase tracking-[0.12em]">
                      Compete • Stream • Conquer
                    </span>
                    <div className="h-0.5 w-6 bg-gradient-to-r from-bts-pink-bright via-white to-transparent rounded-full" />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-white/90 mb-4 leading-relaxed animate-slide-up font-light">
                  Battle with <span className="font-black text-army-gold-bright">ARMY</span> worldwide
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-2.5 animate-scale-in">
                  <Link href="/dashboard" className="w-full">
                    <button className="btn-primary text-xs sm:text-sm px-5 py-2.5 font-black w-full group relative overflow-hidden shadow-glow">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Host a Battle
                      </span>
                    </button>
                  </Link>
                  <Link href="/battles" className="w-full">
                    <button className="bg-white/10 hover:bg-white/20 border-2 border-white/30 text-xs sm:text-sm px-5 py-2.5 font-black w-full group backdrop-blur-sm rounded-xl transition-all duration-300">
                      <span className="flex items-center justify-center gap-2 text-white">
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Join a Battle
                      </span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8">
            <div className="group card-glass p-5 sm:p-6 animate-scale-in hover:-translate-y-2 transition-all duration-400">
              <div className="mb-3 sm:mb-4 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-bts-purple/30 to-bts-deep/20 border-2 border-bts-purple/40 glow-purple group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-bts-purple-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mb-2 tracking-tight">Real Streams</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">Verified through Last.fm scrobbles for guaranteed authenticity</p>
            </div>

            <div className="group card-glass p-5 sm:p-6 animate-scale-in hover:-translate-y-2 transition-all duration-400 delay-75">
              <div className="mb-3 sm:mb-4 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-bts-pink/30 to-bts-pink-light/20 border-2 border-bts-pink/40 glow-pink group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-bts-pink-bright" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mb-2 tracking-tight">Live Updates</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">Real-time leaderboards refresh every 30 seconds automatically</p>
            </div>

            <div className="group card-glass p-5 sm:p-6 animate-scale-in hover:-translate-y-2 transition-all duration-400 delay-150">
              <div className="mb-3 sm:mb-4 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-army-gold/30 to-army-gold-bright/20 border-2 border-army-gold/40 glow-gold group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-army-gold-bright" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mb-2 tracking-tight">Fair Competition</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">Automatic cheat detection and consistent verification</p>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Two Column Grid with Logo on Left */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Logo with Overlaid Content */}
          <div className="col-span-7 xl:col-span-6 flex justify-center">
            <div className="relative animate-slide-up w-full max-w-2xl mb-40">
              <div className="relative w-full aspect-square">
                <Image
                  src="https://res.cloudinary.com/dtamgk7i5/image/upload/v1764741224/armybattles-Picsart-BackgroundRemover_fd11rd.png"
                  alt="ARMY Battles Logo"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>

              {/* Overlaid Title and Buttons Box - positioned lower, extending below logo */}
              <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[80%] bg-[#1a0a24] rounded-2xl border-2 border-bts-purple/50 shadow-2xl p-6 xl:p-8">
                <div className="text-center">
                  <div className="mb-4 animate-slide-up">
                    <h1 className="text-3xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-bts-pink-bright to-white drop-shadow-glow mb-3">
                      ARMYBATTLES
                    </h1>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="h-0.5 w-8 bg-gradient-to-r from-transparent via-white to-bts-pink-bright rounded-full" />
                      <span className="text-xs font-black text-white uppercase tracking-[0.15em]">
                        Compete • Stream • Conquer
                      </span>
                      <div className="h-0.5 w-8 bg-gradient-to-r from-bts-pink-bright via-white to-transparent rounded-full" />
                    </div>
                  </div>

                  <p className="text-sm xl:text-base text-white/90 mb-6 leading-relaxed animate-slide-up font-light">
                    Battle with <span className="font-black text-army-gold-bright">ARMY</span> worldwide
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-3 animate-scale-in">
                    <Link href="/dashboard" className="w-full">
                      <button className="btn-primary text-sm xl:text-base px-6 py-3 font-black w-full group relative overflow-hidden shadow-glow">
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Host a Battle
                        </span>
                      </button>
                    </Link>
                    <Link href="/battles" className="w-full">
                      <button className="bg-white/10 hover:bg-white/20 border-2 border-white/30 text-sm xl:text-base px-6 py-3 font-black w-full group backdrop-blur-sm rounded-xl transition-all duration-300">
                        <span className="flex items-center justify-center gap-2 text-white">
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Join a Battle
                        </span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Feature cards - Vertical Stack */}
          <div className="col-span-5 xl:col-span-6 flex flex-col gap-4">
            <div className="group card-glass p-6 animate-scale-in hover:-translate-y-2 transition-all duration-400">
              <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-bts-purple/30 to-bts-deep/20 border-2 border-bts-purple/40 glow-purple group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-bts-purple-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white mb-2 tracking-tight">Real Streams</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Verified through Last.fm scrobbles for guaranteed authenticity</p>
            </div>

            <div className="group card-glass p-6 animate-scale-in hover:-translate-y-2 transition-all duration-400 delay-75">
              <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-bts-pink/30 to-bts-pink-light/20 border-2 border-bts-pink/40 glow-pink group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-bts-pink-bright" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white mb-2 tracking-tight">Live Updates</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Real-time leaderboards refresh every 30 seconds automatically</p>
            </div>

            <div className="group card-glass p-6 animate-scale-in hover:-translate-y-2 transition-all duration-400 delay-150">
              <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-army-gold/30 to-army-gold-bright/20 border-2 border-army-gold/40 glow-gold group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-army-gold-bright" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white mb-2 tracking-tight">Fair Competition</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Automatic cheat detection and consistent verification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
