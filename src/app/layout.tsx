// src/app/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mirror — Personal Feedback Coach',
  description: 'The feedback your manager isn\'t giving you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#FBFBFB', color: '#1a1a1a', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.6, minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
