'use client'
// src/app/new/page.tsx
// Paste a meeting transcript manually for analysis

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SAMPLE_TRANSCRIPT = `[00:00] Alex: Alright, let's get started. Thanks everyone for joining the quarterly planning call.

[00:08] Jordan: Happy to be here. I wanted to kick off with a quick update on the roadmap — we're tracking well against Q2 goals but there are a few dependencies I want to flag.

[00:21] Alex: Go ahead.

[00:23] Jordan: The API migration is blocked on infra provisioning. I've been waiting on that ticket for two weeks now and it's starting to affect our timeline.

[00:34] Alex: Got it. I'll follow up with the infra team today. Sam, can you take notes on action items?

[00:41] Sam: Sure, on it.

[00:43] Jordan: The other thing is the design review for the new dashboard. We scheduled it for Thursday but I haven't seen any assets come through yet.

[00:52] Alex: That's on me — I'll send those over this afternoon. Anything else blocking you?

[01:00] Jordan: That's the main stuff. I think once those two things are resolved we're in good shape.

[01:07] Alex: Perfect. Let's close out there. Sam, can you send a summary after this?

[01:12] Sam: Will do.`

export default function NewMeetingPage() {
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const charCount = transcript.length
  const isEmpty = !transcript.trim()
  const isDisabled = loading || isEmpty

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isEmpty) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit transcript')
      }

      router.push('/feed')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '44px 40px 80px' }}>

        <button
          onClick={() => router.push('/feed')}
          style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 16, cursor: 'pointer', padding: 0, marginBottom: 36, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Back to feed
        </button>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8, color: '#0f0e0c' }}>
          Paste a transcript
        </h2>
        <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>
          Paste any meeting transcript below and we'll analyze your communication for you.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>
              Transcript
            </p>
            <button
              type="button"
              onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
              style={{ background: 'none', border: 'none', fontFamily: "'DM Mono', monospace", fontSize: 14, letterSpacing: '0.05em', color: '#6b7280', cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}
            >
              Load sample transcript
            </button>
          </div>

          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder="[00:00] Speaker: Paste your meeting transcript here..."
            rows={18}
            style={{
              width: '100%',
              padding: '16px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              lineHeight: 1.7,
              color: '#1a1a1a',
              background: 'white',
              border: '1px solid #ebebeb',
              borderRadius: 8,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: charCount > 0 ? '#6b7280' : '#c0bbb4', margin: 0, letterSpacing: '0.05em' }}>
              {charCount.toLocaleString()} characters
            </p>
            {error && (
              <p style={{ fontSize: 12, color: '#357FEC', margin: 0 }}>{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            style={{
              padding: '12px 28px',
              background: isDisabled ? '#ebebeb' : '#0f0e0c',
              color: isDisabled ? '#6b7280' : '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              fontWeight: 500,
              cursor: isDisabled ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Submitting...' : 'Analyze transcript →'}
          </button>
        </form>

      </div>
    </div>
  )
}
