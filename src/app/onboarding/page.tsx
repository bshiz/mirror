'use client'
// src/app/onboarding/page.tsx
// First-time setup — profile + connect accounts
// Shown automatically when a new user has no profile name set

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const GOALS = [
  'Driving decisions', 'Executive presence', 'Clear communication',
  'Managing up', 'Cross-functional influence', 'Strategic thinking',
  'Listening & empathy', 'Giving feedback to others'
]

export default function OnboardingPage() {
  const [step, setStep] = useState<'profile' | 'connect'>('profile')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [context, setContext] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : prev.length < 3 ? [...prev, g] : prev)
  }

  async function saveProfile() {
    if (!name.trim() || !role.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    await supabase.from('profiles').update({ name: name.trim(), role: role.trim(), company: company.trim(), goals, context: context.trim() }).eq('id', user.id)
    setSaving(false)
    setStep('connect')
  }

  const s: React.CSSProperties = {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }

  if (step === 'profile') return (
    <div style={{ ...s, maxWidth: 560, margin: '0 auto', padding: '72px 40px 80px' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#357FEC', marginBottom: 14 }}>Welcome to Mirror</div>
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 42, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 12 }}>
        Let's set up your <em style={{ fontStyle: 'italic', color: '#357FEC' }}>coaching profile.</em>
      </h1>
      <p style={{ fontSize: 16, color: '#1a1a1a', lineHeight: 1.6, marginBottom: 40, fontWeight: 300 }}>
        Tell us about yourself once. Your coach will use this context in every session — no re-explaining yourself, ever.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>First name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex"
              style={{ width: '100%', padding: '10px 12px', background: 'white', border: '1px solid #ebebeb', borderRadius: 4, fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>Your role / title</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Senior Product Manager"
              style={{ width: '100%', padding: '10px 12px', background: 'white', border: '1px solid #ebebeb', borderRadius: 4, fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>Company or team context</label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. B2B SaaS startup, 50-person eng team"
            style={{ width: '100%', padding: '10px 12px', background: 'white', border: '1px solid #ebebeb', borderRadius: 4, fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>
            What do you most want to improve? <span style={{ fontSize: 12, fontWeight: 300 }}>(pick up to 3)</span>
          </label>
          <div style={{ marginTop: 4 }}>
            {GOALS.map((g, i) => (
              <div key={g} onClick={() => toggleGoal(g)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < GOALS.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                  border: goals.includes(g) ? 'none' : '1px solid #e0e0e0',
                  background: goals.includes(g) ? '#357FEC' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {goals.includes(g) && <span style={{ color: '#ffffff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontSize: 14, color: '#1a1a1a' }}>{g}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>Anything else your coach should know?</label>
          <input type="text" value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. I tend to be too passive in meetings"
            style={{ width: '100%', padding: '10px 12px', background: 'white', border: '1px solid #ebebeb', borderRadius: 4, fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <button onClick={saveProfile} disabled={saving || !name.trim() || !role.trim()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 24px', background: saving ? '#6b7280' : '#0f0e0c', color: '#ffffff', border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', width: 'fit-content' }}>
          {saving ? 'Saving...' : 'Set up my profile →'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ ...s, maxWidth: 560, margin: '0 auto', padding: '64px 40px 80px' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#357FEC', marginBottom: 14 }}>Step 2 of 2</div>
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 10 }}>
        Connect your <em style={{ fontStyle: 'italic', color: '#357FEC' }}>meetings.</em>
      </h1>
      <p style={{ fontSize: 15, color: '#1a1a1a', lineHeight: 1.6, marginBottom: 36, fontWeight: 300 }}>
        Mirror listens where your meetings already live. Connect at least one source and feedback will appear automatically after every meeting ends.
      </p>

      {[
        { key: 'fireflies', name: 'Fireflies', desc: 'Sends transcripts to Mirror as soon as they\'re ready', src: '/logos/fireflies.png' },
        { key: 'otter', name: 'Otter.ai', desc: 'Syncs transcripts from all your recorded meetings', src: '/logos/otter.png' },
        { key: 'gcal', name: 'Google Calendar', desc: 'Detects meetings and pulls transcripts automatically', src: '/logos/gcal.png' },
        { key: 'zoom', name: 'Zoom', desc: 'Uses Zoom\'s cloud transcript feature', src: '/logos/zoom.png' },
      ].map(integration => (
        <div key={integration.key} style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={integration.src} alt={integration.name} width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>{integration.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#6b7280' }}>{integration.desc}</div>
          </div>
          <button
            style={{ padding: '8px 16px', background: 'white', color: '#1a1a1a', border: '1px solid #d0cdc6', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
          >
            Connect
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 0', borderTop: '1px solid #ebebeb', margin: '16px 0', flexWrap: 'wrap' }}>
        {['🔒 Read-only access', '🚫 Your data is never sold', '✕ Disconnect any time'].map(t => (
          <span key={t} style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#6b7280' }}>{t}</span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', fontSize: 16, color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>
          Skip for now
        </button>
        <button onClick={() => router.push('/feed')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 24px', background: '#0f0e0c', color: '#ffffff', border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
          Go to my feed →
        </button>
      </div>
    </div>
  )
}
