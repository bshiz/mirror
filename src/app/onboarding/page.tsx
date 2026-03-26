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
    fontFamily: "'Geist', system-ui, sans-serif",
  }

  if (step === 'profile') return (
    <div style={{ ...s, maxWidth: 560, margin: '0 auto', padding: '72px 40px 80px' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a6fa5', marginBottom: 14 }}>Welcome to Mirror</div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 42, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 12 }}>
        Let's set up your <em style={{ fontStyle: 'italic', color: '#4a6fa5' }}>coaching profile.</em>
      </h1>
      <p style={{ fontSize: 16, color: '#3a3834', lineHeight: 1.6, marginBottom: 40, fontWeight: 300 }}>
        Tell us about yourself once. Your coach will use this context in every session — no re-explaining yourself, ever.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a7770', marginBottom: 6 }}>First name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex"
              style={{ width: '100%', padding: '10px 12px', background: 'white', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a7770', marginBottom: 6 }}>Your role / title</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Senior Product Manager"
              style={{ width: '100%', padding: '10px 12px', background: 'white', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a7770', marginBottom: 6 }}>Company or team context</label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. B2B SaaS startup, 50-person eng team"
            style={{ width: '100%', padding: '10px 12px', background: 'white', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a7770', marginBottom: 6 }}>
            What do you most want to improve? <span style={{ fontSize: 12, fontWeight: 300 }}>(pick up to 3)</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            {GOALS.map(g => (
              <div key={g} onClick={() => toggleGoal(g)}
                style={{ padding: '9px 14px', background: goals.includes(g) ? '#0f0e0c' : 'white', color: goals.includes(g) ? '#f2f2f2' : '#3a3834', border: `1px solid ${goals.includes(g) ? '#0f0e0c' : '#e0e0e0'}`, borderRadius: 4, fontSize: 16, cursor: 'pointer', textAlign: 'center', userSelect: 'none', transition: 'all 0.15s' }}>
                {g}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a7770', marginBottom: 6 }}>Anything else your coach should know?</label>
          <input type="text" value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. I tend to be too passive in meetings"
            style={{ width: '100%', padding: '10px 12px', background: 'white', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <button onClick={saveProfile} disabled={saving || !name.trim() || !role.trim()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 24px', background: saving ? '#7a7770' : '#0f0e0c', color: '#f2f2f2', border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', width: 'fit-content' }}>
          {saving ? 'Saving...' : 'Set up my profile →'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ ...s, maxWidth: 560, margin: '0 auto', padding: '64px 40px 80px' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a6fa5', marginBottom: 14 }}>Step 2 of 2</div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 10 }}>
        Connect your <em style={{ fontStyle: 'italic', color: '#4a6fa5' }}>meetings.</em>
      </h1>
      <p style={{ fontSize: 15, color: '#3a3834', lineHeight: 1.6, marginBottom: 36, fontWeight: 300 }}>
        Mirror listens where your meetings already live. Connect at least one source and feedback will appear automatically after every meeting ends.
      </p>

      {[
        { key: 'fireflies', name: 'Fireflies', desc: 'Sends transcripts to Mirror as soon as they\'re ready', src: '/logos/fireflies.png' },
        { key: 'otter', name: 'Otter.ai', desc: 'Syncs transcripts from all your recorded meetings', src: '/logos/otter.png' },
        { key: 'gcal', name: 'Google Calendar', desc: 'Detects meetings and pulls transcripts automatically', src: '/logos/gcal.png' },
        { key: 'zoom', name: 'Zoom', desc: 'Uses Zoom\'s cloud transcript feature', src: '/logos/zoom.png' },
      ].map(integration => (
        <div key={integration.key} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={integration.src} alt={integration.name} width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>{integration.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#7a7770' }}>{integration.desc}</div>
          </div>
          <button
            style={{ padding: '8px 16px', background: 'white', color: '#3a3834', border: '1px solid #d0cdc6', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f2f2f2' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
          >
            Connect
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 0', borderTop: '1px solid #e0e0e0', margin: '16px 0', flexWrap: 'wrap' }}>
        {['🔒 Read-only access', '🚫 Your data is never sold', '✕ Disconnect any time'].map(t => (
          <span key={t} style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#7a7770' }}>{t}</span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', fontSize: 16, color: '#7a7770', cursor: 'pointer', textDecoration: 'underline' }}>
          Skip for now
        </button>
        <button onClick={() => router.push('/feed')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 24px', background: '#0f0e0c', color: '#f2f2f2', border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
          Go to my feed →
        </button>
      </div>
    </div>
  )
}
