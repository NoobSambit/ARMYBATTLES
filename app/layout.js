import './globals.css'

export const metadata = {
  title: 'ARMY Stream Battles',
  description: 'Real-time music streaming battle platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
