// src/app/api/analyze/route.ts
// Runs Claude analysis on a pending meeting
// Called internally after a meeting is created

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { analyzeTranscript } from '@/lib/analyze'

export async function POST(request: NextRequest) {
  // Internal route — verify it's called from within our app
  const authHeader = request.headers.get('authorization')
  const isInternal = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
  const body = await request.json()

  // Allow internal calls or direct calls with a meetingId
  if (!body.meetingId) {
    return NextResponse.json({ error: 'meetingId required' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { meetingId } = body

  // Fetch the meeting
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (meetingError || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  if (meeting.status !== 'analyzing' && meeting.status !== 'pending') {
    return NextResponse.json({ error: 'Meeting already processed' }, { status: 400 })
  }

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', meeting.user_id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  try {
    // Run analysis
    const result = await analyzeTranscript(meeting.transcript, profile)

    // Save report
    await supabase.from('reports').insert({
      meeting_id: meeting.id,
      user_id: meeting.user_id,
      overall_score: result.overallScore,
      summary: result.summary,
      pillars: result.pillars,
      actions: result.actions,
      coach_opener: result.coachOpener,
    })

    // Update meeting with inferred data + ready status
    await supabase
      .from('meetings')
      .update({
        title: result.meetingTitle,
        meeting_type: result.meetingType,
        inferred_goal: result.inferredGoal,
        status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', meeting.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analysis error:', error)
    await supabase
      .from('meetings')
      .update({ status: 'error', error_message: String(error) })
      .eq('id', meeting.id)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
