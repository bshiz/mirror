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

function scoreColor(s: number) { return s >= 7 ? '#24A24E' : s >= 4 ? '#B8911D' : '#E32E2E' }

function highlightStyle(type: 'strength' | 'gap' | 'watch') {
  if (type === 'strength') return { background: '#e3f0ec', color: '#1a6b5a', fontSize: 12 }
  if (type === 'gap') return { background: '#F3CFCF', color: '#E32E2E', fontSize: 12 }
  return { background: '#F3EACF', color: '#B8911D', fontSize: 12 }
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontStyle: 'italic', color: '#6b7280' }}>
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
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 40px 80px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
        ← All reports
      </button>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontStyle: 'italic', color: '#ebebeb', marginBottom: 16 }}>◎</div>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, marginBottom: 8, color: '#1a1a1a' }}>No report yet for this date</h3>
        <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 340, margin: '0 auto 32px', lineHeight: 1.6 }}>
          No report yet for this date — click to generate from your analyzed meetings.
        </p>
        <button
          onClick={generateReport}
          disabled={generating}
          style={{ padding: '12px 28px', background: generating ? '#6b7280' : '#0f0e0c', color: '#ffffff', border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer' }}
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
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #ebebeb', padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mirror_logo.png" alt="Mirror" style={{ height: 28, width: 'auto', display: 'block' }} />
        <button
          onClick={() => router.push('/profile')}
          style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f0e0c', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, flexShrink: 0 }}
        >
          {profile ? initials(profile.name) : '?'}
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 40px 80px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Back */}
      <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
        ← All reports
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0 }}>
          {fmtDate(report.report_date)}
        </h1>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: '#1a1a1a', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{report.summary}</p>
      </div>

      {/* Score row */}
      {(() => {
        const overall = report.overall_score
        const comm = report.pillars?.find(p => p.name.toLowerCase().includes('commun'))?.score
        const lead = report.pillars?.find(p => p.name.toLowerCase().includes('leader'))?.score
        const strat = report.pillars?.find(p => p.name.toLowerCase().includes('strat'))?.score
        const items = [
          { label: 'Overall', score: overall },
          { label: 'Communication', score: comm },
          { label: 'Leadership', score: lead },
          { label: 'Strategic', score: strat },
        ]
        return (
          <div style={{ background: '#ffffff', border: '1px solid #ebebeb', borderRadius: 10, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', marginBottom: 36 }}>
            {items.map((item, i) => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, borderLeft: i > 0 ? '1px solid #ebebeb' : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>{item.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, lineHeight: 1, color: item.score != null ? scoreColor(item.score) : '#6b7280' }}>
                    {item.score ?? '—'}
                  </span>
                  {item.score != null && <span style={{ fontSize: 12, color: '#6b7280' }}>/10</span>}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Highlights */}
      {report.highlights?.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: '#0f0e0c', margin: '0 0 12px' }}>Areas for improvement</h3>
          <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: 10, overflow: 'hidden' }}>
            {report.highlights.map((h, i) => (
              <div key={i} style={{ padding: '16px 20px', borderBottom: i < report.highlights.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ fontSize: 16, lineHeight: 1.6, color: '#1a1a1a', fontWeight: 500 }}>{h.text}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', marginTop: 4 }}>{h.meeting}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: '#0f0e0c', margin: '0 0 12px' }}>
        Action Items
      </h3>
      <div style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: 10, padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {report.actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', lineHeight: 1.6 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#357FEC', minWidth: 18, marginTop: 2, flexShrink: 0 }}>0{i + 1}</span>
              <span style={{ fontSize: 16, color: '#1a1a1a' }}>{a}</span>
            </div>
          ))}
        </div>
      </div>

      </div>
    </>
  )
}
