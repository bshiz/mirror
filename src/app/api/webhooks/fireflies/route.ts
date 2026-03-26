// src/app/api/webhooks/fireflies/route.ts
// Receives transcript webhooks from Fireflies
// Fireflies POSTs here when a meeting transcript is ready

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { analyzeTranscript } from '@/lib/analyze'
import type { AnalysisResult } from '@/types'

// Fireflies webhook payload shape
interface FirefliesWebhookPayload {
  meetingId: string
  userId?: string
  title: string
  transcript: string
  date: string
  duration: number // minutes
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the webhook secret to ensure it's really from Fireflies
    const secret = request.headers.get('x-webhook-secret')
    if (secret !== process.env.FIREFLIES_WEBHOOK_SECRET) {
      console.error('Webhook secret mismatch')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json() as FirefliesWebhookPayload
    const { meetingId, title, transcript, date } = payload

    if (!transcript || transcript.trim().length < 100) {
      return NextResponse.json({ error: 'Transcript too short' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // 2. Find which Mirror user this Fireflies account belongs to
    // We match via the connections table where provider = 'fireflies'
    // In a real OAuth flow, Fireflies would send a user identifier we can match on
    // For now we look up by the Fireflies API key stored during OAuth
    const { data: connection, error: connError } = await supabase
      .from('connections')
      .select('user_id')
      .eq('provider', 'fireflies')
      .single()

    if (connError || !connection) {
      console.error('No matching Fireflies connection found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = connection.user_id

    // 3. Create the meeting record in 'pending' state
    // This is what makes the card appear in the feed immediately
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        user_id: userId,
        source: 'fireflies',
        source_id: meetingId,
        title: title || 'Untitled meeting',
        transcript,
        status: 'analyzing',
        occurred_at: date || new Date().toISOString(),
      })
      .select()
      .single()

    if (meetingError || !meeting) {
      console.error('Failed to create meeting:', meetingError)
      return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
    }

    // 4. Fetch the user's profile for personalized analysis
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      await supabase.from('meetings').update({ status: 'error', error_message: 'Profile not found' }).eq('id', meeting.id)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 5. Run the Claude analysis
    // This is async — we return 200 immediately and process in the background
    // In production you'd use a queue (Supabase Edge Functions, Inngest, etc.)
    // For now we await directly (works fine for Vercel with generous timeout)
    let result: AnalysisResult
    try {
      result = await analyzeTranscript(transcript, profile)
    } catch (analysisError) {
      console.error('Analysis failed:', analysisError)
      await supabase
        .from('meetings')
        .update({ status: 'error', error_message: 'Analysis failed' })
        .eq('id', meeting.id)
      return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }

    // 6. Save the report
    const { error: reportError } = await supabase
      .from('reports')
      .insert({
        meeting_id: meeting.id,
        user_id: userId,
        overall_score: result.overallScore,
        summary: result.summary,
        pillars: result.pillars,
        actions: result.actions,
        coach_opener: result.coachOpener,
      })

    if (reportError) {
      console.error('Failed to save report:', reportError)
      await supabase.from('meetings').update({ status: 'error', error_message: 'Failed to save report' }).eq('id', meeting.id)
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
    }

    // 7. Update meeting with inferred metadata and mark as ready
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

    // Supabase Realtime will now push the update to the user's feed automatically

    console.log(`✓ Meeting ${meeting.id} analyzed successfully for user ${userId}`)
    return NextResponse.json({ success: true, meetingId: meeting.id })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
