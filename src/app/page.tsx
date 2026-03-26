// src/app/page.tsx
// Middleware handles the redirect, this is just a fallback

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/feed')
}
