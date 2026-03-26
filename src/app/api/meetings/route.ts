// src/app/api/meetings/route.ts
// Returns the authenticated user's meetings with reports joined

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { analyzeTranscript } from '@/lib/analyze'
import type { AnalysisResult } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select(`
      *,
      report:reports(*)
    `)
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ meetings })
}

// POST — create a meeting manually (paste flow, for users without integrations)
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { transcript?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { transcript } = body

  if (!transcript || transcript.trim().length < 100) {
    return NextResponse.json({ error: 'Transcript too short (minimum 100 characters)' }, { status: 400 })
  }

  // Create meeting in analyzing state
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .insert({
      user_id: user.id,
      source: 'manual',
      transcript,
      status: 'analyzing',
      occurred_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (meetingError || !meeting) {
    console.error('[POST /api/meetings] insert error:', meetingError?.message)
    return NextResponse.json({ error: meetingError?.message || 'Failed to create meeting' }, { status: 500 })
  }

  // Use service client for the remaining writes (profile read, report insert, meeting update)
  const serviceSupabase = await createServiceClient()

  // Fetch the user's profile for personalized analysis
  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await serviceSupabase.from('meetings').update({ status: 'error', error_message: 'Profile not found' }).eq('id', meeting.id)
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Run Claude analysis inline
  let result: AnalysisResult
  try {
    result = await analyzeTranscript(transcript, profile)
  } catch (analysisError) {
    console.error('[POST /api/meetings] analysis failed:', analysisError)
    await serviceSupabase.from('meetings').update({ status: 'error', error_message: 'Analysis failed' }).eq('id', meeting.id)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }

  // Save the report
  const { error: reportError } = await serviceSupabase
    .from('reports')
    .insert({
      meeting_id: meeting.id,
      user_id: user.id,
      overall_score: result.overallScore,
      summary: result.summary,
      pillars: result.pillars,
      actions: result.actions,
      coach_opener: result.coachOpener,
    })

  if (reportError) {
    console.error('[POST /api/meetings] failed to save report:', reportError)
    await serviceSupabase.from('meetings').update({ status: 'error', error_message: 'Failed to save report' }).eq('id', meeting.id)
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
  }

  // Update meeting with inferred metadata and mark as ready
  await serviceSupabase
    .from('meetings')
    .update({
      title: result.meetingTitle,
      meeting_type: result.meetingType,
      inferred_goal: result.inferredGoal,
      status: 'ready',
      updated_at: new Date().toISOString(),
    })
    .eq('id', meeting.id)

  console.log(`✓ Meeting ${meeting.id} analyzed successfully for user ${user.id}`)
  return NextResponse.json({ meetingId: meeting.id }, { status: 201 })
}
