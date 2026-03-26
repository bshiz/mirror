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
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setName(data.name || '')
        setRole(data.role || '')
        setCompany(data.company || '')
        setGoals(data.goals || [])
        setContext(data.context || '')
      }
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
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7a7770',
    marginBottom: 6,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: "Georgia, serif", fontSize: 22, fontStyle: 'italic', color: '#7a7770' }}>
      Loading profile...
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '44px 40px 80px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', color: '#7a7770', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          ← Back
        </button>
        <button
          onClick={signOut}
          style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 4, color: '#7a7770', cursor: 'pointer', fontSize: 16, padding: '6px 14px' }}
        >
          Sign out
        </button>
      </div>

      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 6 }}>
        Your profile
      </h1>
      <p style={{ fontSize: 16, color: '#7a7770', marginBottom: 36, lineHeight: 1.6 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            {GOALS.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGoal(g)}
                style={{
                  padding: '9px 14px',
                  background: goals.includes(g) ? '#0f0e0c' : 'white',
                  color: goals.includes(g) ? '#f2f2f2' : '#3a3834',
                  border: `1px solid ${goals.includes(g) ? '#0f0e0c' : '#e0e0e0'}`,
                  borderRadius: 4,
                  fontSize: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                {g}
              </button>
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
          color: '#f2f2f2',
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

      {/* Danger Zone */}
      <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid #e0e0e0' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a6fa5', marginBottom: 12 }}>
          Danger zone
        </div>
        <p style={{ fontSize: 16, color: '#7a7770', marginBottom: 16, lineHeight: 1.6 }}>
          Permanently delete all your meetings, daily reports, and profile data. This cannot be undone.
        </p>
        <button
          onClick={deleteAllData}
          disabled={deleting}
          style={{
            padding: '10px 20px',
            background: 'none',
            color: '#4a6fa5',
            border: '1px solid #4a6fa5',
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
