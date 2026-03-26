// src/app/api/chat-daily/route.ts
// Streams coach chat responses for a daily report
// Same as /api/chat but scoped to the full day instead of a single meeting

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reportId, messages } = await request.json()

  if (!reportId || !messages?.length) {
    return NextResponse.json({ error: 'reportId and messages required' }, { status: 400 })
  }

  const [reportRes, profileRes] = await Promise.all([
    supabase
      .from('daily_reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  ])

  const report = reportRes.data
  const profile = profileRes.data

  if (!report || !profile) {
    return NextResponse.json({ error: 'Report or profile not found' }, { status: 404 })
  }

  const highlightLines = report.highlights
    ?.map((h: { type: string; text: string; meeting: string }) => `[${h.type.toUpperCase()}] ${h.text} (from: ${h.meeting})`)
    .join('\n') || 'None'

  const system = `You are Mirror, a direct and brutally honest professional feedback coach.

You know this person well:
- Name: ${profile.name}
- Role: ${profile.role}
- Company: ${profile.company || 'Not specified'}
- Growth goals: ${profile.goals?.join(', ') || 'Not specified'}

You have already analyzed their entire day of meetings and generated this daily report:
Date: ${report.report_date}
Meetings: ${report.meeting_count}
Overall day score: ${report.overall_score}/10

Summary: ${report.summary}

Highlights across all meetings:
${highlightLines}

Pillars:
${JSON.stringify(report.pillars, null, 2)}

Actions for tomorrow:
${report.actions?.join('\n')}

Coaching rules:
- Be direct and specific — reference concrete moments from the day
- Use ${profile.name}'s name occasionally, not every message
- Connect feedback to their stated growth goals when relevant
- Keep replies to 2-4 sentences unless they explicitly ask for more detail
- No bullet points in chat — write in prose
- Sound like a sharp, experienced mentor who has seen this person's full day
- Don't repeat feedback from the report verbatim — add new angles and depth
- If they ask for a script or what to say next time, give them actual words they can use`

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  })

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
