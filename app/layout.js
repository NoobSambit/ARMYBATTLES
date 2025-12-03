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
  icons: {
    icon: 'https://res.cloudinary.com/dtamgk7i5/image/upload/v1764741224/armybattles-Picsart-BackgroundRemover_fd11rd.png',
    apple: 'https://res.cloudinary.com/dtamgk7i5/image/upload/v1764741224/armybattles-Picsart-BackgroundRemover_fd11rd.png',
  },
  openGraph: {
    title: 'ARMYBATTLES',
    description: 'Real-time BTS streaming battles powered by verified scrobbles',
    type: 'website',
    images: [
      {
        url: 'https://res.cloudinary.com/dtamgk7i5/image/upload/v1764741224/armybattles-Picsart-BackgroundRemover_fd11rd.png',
        width: 1200,
        height: 630,
        alt: 'ARMYBATTLES',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARMYBATTLES',
    description: 'Real-time BTS streaming battles powered by verified scrobbles',
    images: ['https://res.cloudinary.com/dtamgk7i5/image/upload/v1764741224/armybattles-Picsart-BackgroundRemover_fd11rd.png'],
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
