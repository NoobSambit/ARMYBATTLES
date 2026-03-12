import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Inter, Outfit } from 'next/font/google'

function resolveSiteUrl() {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:5000'

  return candidate.startsWith('http') ? candidate : `https://${candidate}`
}

const siteName = 'ARMYBATTLES'
const description = 'ARMYBATTLES — Real-time BTS streaming battles powered by verified scrobbles'
const previewImage = '/armybattles_preview.png?v=20260312'

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B0B11' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
}

export const metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: siteName,
  description,
  icons: {
    icon: '/armybattles_logo.png',
    apple: '/armybattles_logo.png',
  },
  openGraph: {
    title: siteName,
    description,
    type: 'website',
    siteName,
    url: '/',
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

const inter = Inter({ subsets: ['latin'], variable: '--font-text' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' })

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`antialiased bg-surface ${inter.variable} ${outfit.variable} font-sans flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
