import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative bg-panel overflow-hidden border-b border-border">
      <div className="absolute inset-0 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="hero-title mb-6">ARMYBATTLES</h1>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Compete with ARMY worldwide. Real verified streams, real winners.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard">
              <button className="btn-primary text-lg px-8 py-4 shadow-glow-purple-lg">
                Host a Battle
              </button>
            </Link>
            <Link href="/battles">
              <button className="btn-secondary text-lg px-8 py-4">
                Join a Battle
              </button>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="bg-panel border border-border rounded-lg p-5">
              <h3 className="text-base font-semibold text-gray-100 mb-1">Real Streams</h3>
              <p className="text-gray-400 text-sm">Verified through Last.fm scrobbles</p>
            </div>
            <div className="bg-panel border border-border rounded-lg p-5">
              <h3 className="text-base font-semibold text-gray-100 mb-1">Live Updates</h3>
              <p className="text-gray-400 text-sm">Leaderboards refresh every 30s</p>
            </div>
            <div className="bg-panel border border-border rounded-lg p-5">
              <h3 className="text-base font-semibold text-gray-100 mb-1">Fair Competition</h3>
              <p className="text-gray-400 text-sm">Automatic & consistent checks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
