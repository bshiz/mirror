'use client'
// src/app/feed/page.tsx
// Daily report feed — updates live via Supabase Realtime

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface DailyReport {
  id: string
  report_date: string
  overall_score: number
  summary: string
  meeting_count: number
}

function scoreColor(s: number) { return s >= 7 ? '#1a6b5a' : s >= 5 ? '#b8860b' : '#4a6fa5' }

function fmtReportDate(dateStr: string) {
  // dateStr is YYYY-MM-DD — parse as local date to avoid UTC offset shifting the day
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function FeedPage() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
    const cleanup = subscribeToUpdates()
    return cleanup
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof?.name) { router.push('/onboarding'); return }
    setProfile(prof)

    const { data } = await supabase
      .from('daily_reports')
      .select('id, report_date, overall_score, summary, meeting_count')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false })
      .limit(30)

    setReports(data || [])
    setLoading(false)
  }

  function subscribeToUpdates() {
    const channel = supabase
      .channel('daily-reports-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'daily_reports',
      }, () => {
        loadData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: "Georgia, serif", fontSize: 24, fontStyle: 'italic', color: '#7a7770' }}>
      Loading your feed...
    </div>
  )

  function initials(n: string) {
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e0e0e0', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '44px 40px 80px', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 32, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {greeting}, <em style={{ fontStyle: 'italic', color: '#4a6fa5' }}>{profile?.name}.</em>
        </h2>
        <p style={{ fontSize: 16, color: '#7a7770', marginTop: 6 }}>
          {reports.length} day{reports.length !== 1 ? 's' : ''} of feedback.
        </p>
      </div>

      {reports.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.map(r => (
              <div
                key={r.id}
                onClick={() => router.push(`/daily/${r.report_date}`)}
                style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 16px rgba(15,14,12,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 17, marginBottom: 4 }}>
                    {fmtReportDate(r.report_date)}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#7a7770' }}>
                    {r.meeting_count} meeting{r.meeting_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <div style={{ background: '#e8e8e8', borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 52 }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontStyle: 'italic', color: scoreColor(r.overall_score), lineHeight: 1 }}>
                      {r.overall_score}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#7a7770' }}>/ 10</div>
                  </div>
                  <span style={{ color: '#e0e0e0', fontSize: 18 }}>›</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {reports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 40, fontStyle: 'italic', color: '#e0e0e0', marginBottom: 16 }}>◎</div>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, marginBottom: 8, color: '#3a3834' }}>No meetings yet</h3>
          <p style={{ fontSize: 16, color: '#7a7770', maxWidth: 320, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Connect a meeting recorder and feedback will appear here automatically. Or paste a transcript now to see how it works.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => router.push('/onboarding')}
              style={{ padding: '12px 24px', background: '#0f0e0c', color: '#f2f2f2', border: 'none', borderRadius: 4, fontFamily: 'system-ui, sans-serif', fontSize: 16, fontWeight: 500, cursor: 'pointer', width: 280 }}>
              Connect a meeting source →
            </button>
            <button
              onClick={() => router.push('/new')}
              style={{ padding: '12px 24px', background: 'none', color: '#3a3834', border: '1px solid #e0e0e0', borderRadius: 4, fontFamily: 'system-ui, sans-serif', fontSize: 16, cursor: 'pointer', width: 280 }}>
              Paste a transcript manually
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
