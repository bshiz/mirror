'use client'
// src/app/profile/page.tsx

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const GOALS = [
  'Driving decisions', 'Executive presence', 'Clear communication',
  'Managing up', 'Cross-functional influence', 'Strategic thinking',
  'Listening & empathy', 'Giving feedback to others'
]

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [connectedKeys, setConnectedKeys] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  const INTEGRATIONS = [
    { key: 'fireflies', name: 'Fireflies', logo: '/logos/fireflies.png' },
    { key: 'otter', name: 'Otter.ai', logo: '/logos/otter.png' },
    { key: 'gcal', name: 'Google Calendar', logo: '/logos/gcal.png' },
    { key: 'zoom', name: 'Zoom', logo: '/logos/zoom.png' },
  ]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [profileRes, connectionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('connections').select('provider').eq('user_id', user.id),
      ])
      if (profileRes.data) {
        setName(profileRes.data.name || '')
        setRole(profileRes.data.role || '')
        setCompany(profileRes.data.company || '')
        setGoals(profileRes.data.goals || [])
        setContext(profileRes.data.context || '')
      }
      setConnectedKeys((connectionsRes.data || []).map((c: { provider: string }) => c.provider))
      setLoading(false)
    }
    load()
  }, [])

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : prev.length < 3 ? [...prev, g] : prev)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      name: name.trim(),
      role: role.trim(),
      company: company.trim(),
      goals,
      context: context.trim(),
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function deleteAllData() {
    if (!confirm('This will permanently delete all your meetings, reports, and profile. Are you sure?')) return
    setDeleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('meetings').delete().eq('user_id', user.id)
    await supabase.from('daily_reports').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'white',
    border: '1px solid #ebebeb',
    borderRadius: 4,
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 6,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontStyle: 'italic', color: '#6b7280' }}>
      Loading profile...
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '44px 40px 80px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          ← Back
        </button>
        <button
          onClick={signOut}
          style={{ background: 'none', border: '1px solid #ebebeb', borderRadius: 4, color: '#6b7280', cursor: 'pointer', fontSize: 16, padding: '6px 14px' }}
        >
          Sign out
        </button>
      </div>

      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 6 }}>
        Your profile
      </h1>
      <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 36, lineHeight: 1.6 }}>
        Your coach uses this context in every session.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>First name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Your role / title</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Senior Product Manager" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Company or team context</label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. B2B SaaS startup, 50-person eng team" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>
            What do you most want to improve? <span style={{ fontSize: 12, fontWeight: 300 }}>(pick up to 3)</span>
          </label>
          <div style={{ marginTop: 4 }}>
            {GOALS.map((g, i) => (
              <div
                key={g}
                onClick={() => toggleGoal(g)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < GOALS.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer' }}
              >
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
          <label style={labelStyle}>Additional context</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Anything else your coach should know — your biggest challenge, team dynamics, recent wins or struggles..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          padding: '12px 28px',
          background: saved ? '#1a6b5a' : '#0f0e0c',
          color: '#ffffff',
          border: 'none',
          borderRadius: 4,
          fontSize: 16,
          fontWeight: 500,
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save changes'}
      </button>

      {/* Connected accounts */}
      <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #ebebeb' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: '#0f0e0c', margin: '0 0 16px' }}>
          Connected accounts
        </h2>
        <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: 10, overflow: 'hidden' }}>
          {INTEGRATIONS.map((intg, i) => {
            const connected = connectedKeys.includes(intg.key)
            return (
              <div key={intg.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < INTEGRATIONS.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={intg.logo} alt={intg.name} width={32} height={32} style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{intg.name}</span>
                {connected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#24A24E', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#24A24E', fontWeight: 500 }}>Connected</span>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push('/onboarding')}
                    style={{ padding: '6px 14px', background: 'none', color: '#1a1a1a', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 13, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Connect
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid #ebebeb' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E32E2E', marginBottom: 12 }}>
          Danger zone
        </div>
        <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
          Permanently delete all your meetings, daily reports, and profile data. This cannot be undone.
        </p>
        <button
          onClick={deleteAllData}
          disabled={deleting}
          style={{
            padding: '10px 20px',
            background: 'none',
            color: '#E32E2E',
            border: '1px solid #E32E2E',
            borderRadius: 4,
            fontSize: 16,
            cursor: deleting ? 'not-allowed' : 'pointer',
            opacity: deleting ? 0.6 : 1,
          }}
        >
          {deleting ? 'Deleting...' : 'Delete all my data'}
        </button>
      </div>
    </div>
  )
}
