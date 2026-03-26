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
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Geist:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#f2f2f2',color: '#0f0e0c', fontFamily: "'Geist', system-ui, sans-serif", lineHeight: 1.6, minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
