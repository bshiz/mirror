'use client'
// src/components/CoachChat.tsx
// Streaming coach chat component for the report page

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CoachChatProps {
  meetingId?: string
  reportId?: string
  openerMessage: string
  userName: string
}

const SUGGESTIONS = [
  "Why was my score that low?",
  "What was my biggest mistake?",
  "How do I handle pushback better?",
  "Give me a script for next time",
]

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function CoachChat({ meetingId, reportId, openerMessage, userName }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: openerMessage }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const prevMessageCountRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current || streamingContent) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessageCountRef.current = messages.length
  }, [messages, streamingContent])

  async function send(text: string) {
    if (!text.trim() || streaming) return
    const userMessage: Message = { role: 'user', content: text.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setStreaming(true)
    setStreamingContent('')

    try {
      const endpoint = reportId ? '/api/chat-daily' : '/api/chat'
      const payload = reportId
        ? { reportId, messages: updatedMessages }
        : { meetingId, messages: updatedMessages }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Chat failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          setStreamingContent(fullContent)
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullContent }])
      setStreamingContent('')
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong — try again.' }])
      setStreamingContent('')
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const s = {
    section: { background: 'white', border: '1px solid #ebebeb', borderRadius: 10, overflow: 'hidden' } as React.CSSProperties,
    header: { padding: '16px 20px', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
    avatar: { width: 30, height: 30, background: '#0f0e0c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: 'italic', fontSize: 16, color: '#ffffff', flexShrink: 0 } as React.CSSProperties,
    messages: { padding: '18px 20px', maxHeight: 340, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 14 },
    msgCoach: { display: 'flex', gap: 8, maxWidth: '88%' } as React.CSSProperties,
    msgUser: { display: 'flex', gap: 8, maxWidth: '88%', alignSelf: 'flex-end', flexDirection: 'row-reverse' as const } as React.CSSProperties,
    bubbleCoach: { padding: '10px 14px', borderRadius: 10, fontSize: 16, lineHeight: 1.6, background: '#ffffff', color: '#0f0e0c' } as React.CSSProperties,
    bubbleUser: { padding: '10px 14px', borderRadius: 10, fontSize: 16, lineHeight: 1.6, background: '#0f0e0c', color: '#ffffff' } as React.CSSProperties,
    msgAvatar: { width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, marginTop: 2 } as React.CSSProperties,
    suggestions: { display: 'flex', flexWrap: 'wrap' as const, gap: 6, padding: '0 20px 14px' },
    chip: { padding: '6px 12px', background: '#ffffff', border: '1px solid #ebebeb', borderRadius: 20, fontSize: 12, color: '#1a1a1a', cursor: 'pointer' } as React.CSSProperties,
    inputRow: { display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid #ebebeb' } as React.CSSProperties,
    input: { flex: 1, padding: '9px 14px', background: '#ffffff', border: '1px solid #ebebeb', borderRadius: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, color: '#0f0e0c', outline: 'none' } as React.CSSProperties,
    sendBtn: { padding: '9px 16px', background: '#357FEC', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
  }

  // Show suggestions only if conversation is just the opener
  const showSuggestions = messages.length === 1 && !streaming

  return (
    <div style={s.section}>
      <div style={s.header}>
        <div style={s.avatar}>M</div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 16 }}>Mirror Coach</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#357FEC' }}>
            {streaming ? '● Typing...' : '● Ready to dig in'}
          </div>
        </div>
      </div>

      <div style={s.messages}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? s.msgUser : s.msgCoach}>
            <div style={{
              ...s.msgAvatar,
              background: msg.role === 'assistant' ? '#0f0e0c' : '#ebebeb',
              color: msg.role === 'assistant' ? '#ffffff' : '#6b7280',
            }}>
              {msg.role === 'assistant' ? 'M' : initials(userName)}
            </div>
            <div style={msg.role === 'user' ? s.bubbleUser : s.bubbleCoach}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming bubble */}
        {streaming && (
          <div style={s.msgCoach}>
            <div style={{ ...s.msgAvatar, background: '#0f0e0c', color: '#ffffff' }}>M</div>
            <div style={s.bubbleCoach}>
              {streamingContent || (
                <span style={{ display: 'flex', gap: 3, alignItems: 'center', padding: '2px 0' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 4, height: 4, background: '#6b7280', borderRadius: '50%', animation: `dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </span>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && (
        <div style={s.suggestions}>
          {SUGGESTIONS.map(s => (
            <div key={s} style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #ebebeb', borderRadius: 20, fontSize: 12, color: '#1a1a1a', cursor: 'pointer' }}
              onClick={() => send(s)}>
              {s}
            </div>
          ))}
        </div>
      )}

      <div style={s.inputRow}>
        <input
          ref={inputRef}
          style={s.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this meeting..."
          disabled={streaming}
        />
        <button
          style={{ ...s.sendBtn, opacity: streaming ? 0.5 : 1, cursor: streaming ? 'not-allowed' : 'pointer' }}
          onClick={() => send(input)}
          disabled={streaming}
        >
          Send
        </button>
      </div>

      <style>{`
        @keyframes dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
