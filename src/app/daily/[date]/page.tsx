'use client'
// src/app/daily/[date]/page.tsx
// Daily synthesis report for a single day

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Highlight {
  type: 'strength' | 'gap' | 'watch'
  text: string
  meeting: string
}

interface Pillar {
  name: string
  icon: string
  score: number
  verdict: string
}

interface DailyReport {
  id: string
  report_date: string
  overall_score: number
  summary: string
  meeting_count: number
  highlights: Highlight[]
  pillars: Pillar[]
  actions: string[]
  coach_opener: string
}

function scoreColor(s: number) { return s >= 7 ? '#1a6b5a' : s >= 5 ? '#b8860b' : '#4a6fa5' }

function highlightStyle(type: 'strength' | 'gap' | 'watch') {
  if (type === 'strength') return { background: '#e3f0ec', color: '#1a6b5a' }
  if (type === 'gap') return { background: '#f0e8e4', color: '#c8472a' }
  return { background: '#f5f0e0', color: '#b8860b' }
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function DailyReportPage() {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [profile, setProfile] = useState<{ name: string } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const date = params.date as string
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [reportRes, profileRes] = await Promise.all([
        supabase
          .from('daily_reports')
          .select('*')
          .eq('user_id', user.id)
          .eq('report_date', date)
          .single(),
        supabase.from('profiles').select('name').eq('id', user.id).single(),
      ])

      setReport(reportRes.data)
      setProfile(profileRes.data)
      setLoading(false)
    }
    load()
  }, [date])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: "Georgia, serif", fontSize: 22, fontStyle: 'italic', color: '#7a7770' }}>
      Loading report...
    </div>
  )

  async function generateReport() {
    setGenerating(true)
    await fetch('/api/daily-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    })
    setGenerating(false)
    window.location.reload()
  }

  if (!report) return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 40px 80px', fontFamily: 'system-ui, sans-serif' }}>
      <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', color: '#7a7770', cursor: 'pointer', fontSize: 16, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
        ← All reports
      </button>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 40, fontStyle: 'italic', color: '#e0e0e0', marginBottom: 16 }}>◎</div>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, marginBottom: 8, color: '#3a3834' }}>No report yet for this date</h3>
        <p style={{ fontSize: 16, color: '#7a7770', maxWidth: 340, margin: '0 auto 32px', lineHeight: 1.6 }}>
          No report yet for this date — click to generate from your analyzed meetings.
        </p>
        <button
          onClick={generateReport}
          disabled={generating}
          style={{ padding: '12px 28px', background: generating ? '#7a7770' : '#0f0e0c', color: '#f2f2f2', border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer' }}
        >
          {generating ? 'Generating...' : 'Generate today\'s report'}
        </button>
      </div>
    </div>
  )

  function initials(n: string) {
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e0e0e0', padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, letterSpacing: '-0.01em' }}>
          Mirror<span style={{ color: '#4a6fa5' }}>.</span>
        </div>
        <button
          onClick={() => router.push('/profile')}
          style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f0e0c', color: '#f2f2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, flexShrink: 0 }}
        >
          {profile ? initials(profile.name) : '?'}
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 40px 80px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Back */}
      <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', color: '#7a7770', cursor: 'pointer', fontSize: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
        ← All reports
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 24 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a7770', marginBottom: 10 }}>
            Daily synthesis
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0 }}>
            {fmtDate(report.report_date)}
          </h1>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#7a7770', marginTop: 8 }}>
            {report.meeting_count} meeting{report.meeting_count !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ background: '#e8e8e8', borderRadius: 10, padding: '18px 24px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 40, fontStyle: 'italic', color: scoreColor(report.overall_score), lineHeight: 1, marginBottom: 2 }}>
            {report.overall_score}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#7a7770', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Overall</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: '#eef1f7', borderLeft: '3px solid #4a6fa5', padding: '16px 20px', marginBottom: 32, fontSize: 16, lineHeight: 1.7, color: '#3a3834', fontFamily: "'Geist', system-ui, sans-serif" }}>
        {report.summary}
      </div>

      {/* Highlights */}
      {report.highlights?.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a7770', marginBottom: 12 }}>Highlights</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {report.highlights.map((h, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '3px 7px', borderRadius: 20, flexShrink: 0, marginTop: 2,
                  ...highlightStyle(h.type)
                }}>
                  {h.type}
                </span>
                <div>
                  <div style={{ fontSize: 16, lineHeight: 1.6, color: '#3a3834' }}>{h.text}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#7a7770', marginTop: 4 }}>{h.meeting}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pillars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
        {report.pillars.map((p, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{p.icon}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 600 }}>{p.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 80, height: 3, background: '#e8e8e8', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: scoreColor(p.score), width: `${p.score * 10}%` }} />
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color: scoreColor(p.score), minWidth: 30, textAlign: 'right' }}>{p.score}/10</div>
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e8e8e8' }}>
              <p style={{ fontFamily: "'Geist', system-ui, sans-serif", fontSize: 16, color: '#3a3834', padding: '14px 0 0', lineHeight: 1.6, margin: 0 }}>{p.verdict}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 600, color: '#0f0e0c', marginBottom: 16, margin: '0 0 16px' }}>
          For tomorrow
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {report.actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', lineHeight: 1.6 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#4a6fa5', minWidth: 18, marginTop: 2, flexShrink: 0 }}>0{i + 1}</span>
              <span style={{ fontSize: 16, color: '#3a3834' }}>{a}</span>
            </div>
          ))}
        </div>
      </div>

      </div>
    </>
  )
}
