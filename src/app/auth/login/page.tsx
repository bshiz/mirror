'use client'
// src/app/auth/login/page.tsx

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

async function handleLogin(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${location.origin}/auth/callback` },
  })
  if (error) {
    alert('Error: ' + error.message)
  } else {
    setSent(true)
  }
  setLoading(false)
}

  return (
    <div style={{ maxWidth: 420, margin: '120px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, marginBottom: 8 }}>
        Mirror<span style={{ color: '#4a6fa5' }}>.</span>
      </h1>
      <p style={{ color: '#7a7770', marginBottom: 40, fontSize: 16 }}>
        The feedback your manager isn't giving you.
      </p>
      {sent ? (
        <div style={{ background: '#e3f0ec', border: '1px solid #1a6b5a', borderRadius: 8, padding: '16px 20px' }}>
          <p style={{ color: '#1a6b5a', margin: 0, fontSize: 16 }}>
            Check your email — we sent a magic link to <strong>{email}</strong>
          </p>
        </div>
      ) : (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: '10px 14px', borderRadius: 4, border: '1px solid #e0e0e0', fontSize: 16, outline: 'none' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px 20px', background: '#0f0e0c', color: 'white', border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}
          >
            {loading ? 'Sending...' : 'Continue with email →'}
          </button>
        </form>
      )}
    </div>
  )
}
