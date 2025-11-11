import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'ARMY Stream Battles',
  description: 'Real-time music streaming battle platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
