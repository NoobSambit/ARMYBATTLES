import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative bg-gradient-purple overflow-hidden">
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="hero-title animate-float mb-6">
            Join BTS Streaming Battles
          </h1>
          
          <p className="text-xl sm:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
            Compete with ARMY worldwide. Real verified streams, real winners.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard">
              <button className="btn-primary text-lg px-8 py-4 shadow-glow-purple-lg hover:scale-105">
                Host a Battle
              </button>
            </Link>
            <Link href="/battles">
              <button className="btn-secondary text-lg px-8 py-4 bg-white/10 border-white text-white hover:bg-white hover:text-army-purple">
                Join a Battle
              </button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-4xl font-bold text-white mb-2">🎵</div>
              <h3 className="text-lg font-semibold text-white mb-2">Real Streams</h3>
              <p className="text-purple-100 text-sm">Verified through Last.fm scrobbles</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-4xl font-bold text-white mb-2">⚡</div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Updates</h3>
              <p className="text-purple-100 text-sm">Real-time leaderboards every 30s</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-4xl font-bold text-white mb-2">🏆</div>
              <h3 className="text-lg font-semibold text-white mb-2">Fair Competition</h3>
              <p className="text-purple-100 text-sm">Automatic cheat detection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
