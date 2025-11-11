export const metadata = {
  title: 'ARMY Stream Battles',
  description: 'Real-time music streaming battle platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  )
}
