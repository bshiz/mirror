'use client'
// src/app/report/[id]/page.tsx

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CoachChat from '@/components/CoachChat'
import type { Meeting } from '@/types'

function scoreColor(s: number) { return s >= 7 ? '#1a6b5a' : s >= 5 ? '#b8860b' : '#E32E2E' }

export default function ReportPage() {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [profile, setProfile] = useState<{ name: string } | null>(null)
  const [openPillars, setOpenPillars] = useState<Set<number>>(new Set([0]))
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [meetingRes, profileRes] = await Promise.all([
        supabase.from('meetings').select('*, report:reports(*)').eq('id', params.id as string).single(),
        supabase.from('profiles').select('name').single(),
      ])
      setMeeting(meetingRes.data)
      setProfile(profileRes.data)
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontStyle: 'italic', color: '#6b7280' }}>Loading report...</div>
  if (!meeting?.report) return <div style={{ padding: 40, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#6b7280' }}>Report not found.</div>

  const r = meeting.report

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '44px 40px 80px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Back */}
      <button onClick={() => router.push('/feed')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
        ← All meetings
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 24 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', background: '#ebebeb', padding: '3px 10px', borderRadius: 20 }}>
              {meeting.meeting_type || 'Meeting'}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#6b7280' }}>
              {new Date(meeting.occurred_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0 }}>
            {meeting.title}
          </h1>
        </div>
        <div style={{ background: '#ebebeb', borderRadius: 10, padding: '18px 24px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontStyle: 'italic', color: scoreColor(r.overall_score), lineHeight: 1, marginBottom: 2 }}>
            {r.overall_score}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Overall</div>
        </div>
      </div>

      {/* Inferred goal */}
      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: 'italic', fontSize: 16, color: '#6b7280', marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid #ebebeb' }}>
        <strong style={{ fontStyle: 'normal', fontWeight: 400, color: '#1a1a1a' }}>Inferred goal:</strong> {meeting.inferred_goal}
      </p>

      {/* Summary */}
      <div style={{ background: '#eef5fd', borderLeft: '3px solid #357FEC', padding: '16px 20px', marginBottom: 32, fontSize: 16, lineHeight: 1.7, color: '#1a1a1a', fontStyle: 'italic', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {r.summary}
      </div>

      {/* Pillars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
        {r.pillars.map((p, i) => {
          const isOpen = openPillars.has(i)
          return (
            <div key={i} style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: 10, overflow: 'hidden' }}>
              <div
                onClick={() => {
                  const next = new Set(openPillars)
                  isOpen ? next.delete(i) : next.add(i)
                  setOpenPillars(next)
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', gap: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{p.icon}</div>
                  <div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#6b7280', marginTop: 1 }}>{p.tagline}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 80, height: 3, background: '#ebebeb', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: scoreColor(p.score), width: `${p.score * 10}%` }} />
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color: scoreColor(p.score), minWidth: 30, textAlign: 'right' }}>{p.score}/10</div>
                  <div style={{ fontSize: 11, color: '#ebebeb', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid #ebebeb' }}>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: 'italic', fontSize: 16, color: '#1a1a1a', padding: '14px 0 12px', lineHeight: 1.6, margin: 0 }}>{p.verdict}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {p.points.map((pt, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, fontSize: 16, lineHeight: 1.65, color: '#1a1a1a' }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '3px 7px', borderRadius: 20, flexShrink: 0, marginTop: 2, height: 'fit-content',
                          background: pt.type === 'strength' ? '#e3f0ec' : pt.type === 'gap' ? '#f0e8e4' : '#f5f0e0',
                          color: pt.type === 'strength' ? '#1a6b5a' : pt.type === 'gap' ? '#357FEC' : '#b8860b'
                        }}>{pt.type}</span>
                        <div>
                          <div>{pt.text}</div>
                          {pt.quote && (
                            <div style={{ background: '#ffffff', borderLeft: '2px solid #ebebeb', padding: '8px 12px', marginTop: 6, fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                              "{pt.quote}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div style={{ background: '#0f0e0c', color: '#ffffff', borderRadius: 10, padding: 28, marginBottom: 32 }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontStyle: 'italic', marginBottom: 18, opacity: 0.9 }}>
          Before your next meeting.
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {r.actions.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 16, lineHeight: 1.6, opacity: 0.85 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#357FEC', minWidth: 18, marginTop: 3 }}>0{i + 1}</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Coach chat */}
      {meeting.id && r.coach_opener && (
        <CoachChat
          meetingId={meeting.id}
          openerMessage={r.coach_opener}
          userName={profile?.name || 'You'}
        />
      )}
    </div>
  )
}
