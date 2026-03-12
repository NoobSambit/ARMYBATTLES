import Link from 'next/link'

const siteName = 'ARMYBATTLES'
const description = 'ARMYBATTLES — Real-time BTS streaming battles powered by verified scrobbles'
const previewImage = '/armybattles_preview.png?v=20260312'

export const metadata = {
  title: siteName,
  description,
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: siteName,
    description,
    type: 'website',
    url: '/share',
    siteName,
    images: [
      {
        url: previewImage,
        width: 2848,
        height: 1504,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description,
    images: [previewImage],
  },
}

export default function SharePage() {
  return (
    <section className="min-h-[70vh] bg-background-dark px-6 py-28 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 px-8 py-14 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
          Shared Preview
        </span>
        <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
          ARMYBATTLES
        </h1>
        <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Real-time BTS streaming battles powered by verified scrobbles.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-xl border border-fuchsia-300/25 bg-[linear-gradient(135deg,rgba(189,69,126,0.98)_0%,rgba(129,34,107,0.96)_55%,rgba(59,14,57,0.96)_100%)] px-8 py-4 text-base font-black text-white transition-transform hover:-translate-y-1"
          >
            Open Site
          </Link>
          <Link
            href="/battles"
            className="rounded-xl border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(16,78,95,0.98)_0%,rgba(10,46,57,0.96)_55%,rgba(7,21,30,0.96)_100%)] px-8 py-4 text-base font-bold text-slate-100 transition-transform hover:-translate-y-1"
          >
            View Battles
          </Link>
        </div>
      </div>
    </section>
  )
}
