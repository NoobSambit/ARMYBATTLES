import './globals.css'
import Navbar from '@/components/Navbar'
import { Inter, Space_Grotesk } from 'next/font/google'

export const metadata = {
  title: 'ARMYBATTLES',
  description: 'ARMYBATTLES — Real-time BTS streaming battles powered by verified scrobbles',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B0B11' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  openGraph: {
    title: 'ARMYBATTLES',
    description: 'Real-time BTS streaming battles powered by verified scrobbles',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARMYBATTLES',
    description: 'Real-time BTS streaming battles powered by verified scrobbles',
  },
}

const inter = Inter({ subsets: ['latin'], variable: '--font-text' })
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`antialiased bg-surface ${inter.variable} ${grotesk.variable} font-sans`}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
