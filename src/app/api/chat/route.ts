// src/app/api/chat/route.ts
// Streams coach chat responses back to the client
// Uses the Anthropic streaming API so responses feel instant

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { meetingId, messages } = await request.json()

  if (!meetingId || !messages?.length) {
    return NextResponse.json({ error: 'meetingId and messages required' }, { status: 400 })
  }

  // Fetch meeting + report + profile — all the context the coach needs
  const [meetingRes, profileRes] = await Promise.all([
    supabase
      .from('meetings')
      .select('*, report:reports(*)')
      .eq('id', meetingId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  ])

  const meeting = meetingRes.data
  const profile = profileRes.data

  if (!meeting || !profile) {
    return NextResponse.json({ error: 'Meeting or profile not found' }, { status: 404 })
  }

  const report = meeting.report

  const system = `You are Mirror, a direct and brutally honest professional feedback coach.

You know this person well:
- Name: ${profile.name}
- Role: ${profile.role}
- Company: ${profile.company || 'Not specified'}
- Growth goals: ${profile.goals?.join(', ') || 'Not specified'}

You have already analyzed their meeting and generated this feedback report:
Meeting: ${meeting.title} (${meeting.meeting_type})
Inferred goal: ${meeting.inferred_goal}
Overall score: ${report?.overall_score}/10

Summary: ${report?.summary}

Full report:
${JSON.stringify(report?.pillars, null, 2)}

Actions given:
${report?.actions?.join('\n')}

The original transcript:
${meeting.transcript}

Coaching rules:
- Be direct and specific — always reference concrete moments from the transcript
- Use ${profile.name}'s name occasionally, not every message
- Connect feedback to their stated growth goals when relevant
- Keep replies to 2-4 sentences unless they explicitly ask for more detail
- No bullet points in chat — write in prose
- Sound like a sharp, experienced mentor who has seen a lot of meetings
- Don't repeat feedback from the report verbatim — add new angles and depth
- If they ask for a script or what to say next time, give them actual words they can use`

  // Stream the response back
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  })

  // Return a streaming response
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
