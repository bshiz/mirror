// src/app/api/daily-report/route.ts
// Synthesizes all ready meetings for a given date into a single daily report

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { analyzeDailyReport } from '@/lib/analyze'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Allow cron job to bypass session auth using CRON_SECRET + userId in body
  const authHeader = request.headers.get('authorization')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}` && !!body.userId

  let userId: string

  if (isCron) {
    userId = body.userId
  } else {
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = user.id
  }

  // Default to today if no date provided
  const date: string = body.date ?? new Date().toISOString().slice(0, 10)

  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  const supabase = await createServiceClient()

  // Fetch all ready meetings for this user on the given date
  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('id, title, transcript, occurred_at, reports(*)')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .gte('occurred_at', dayStart)
    .lte('occurred_at', dayEnd)

  if (meetingsError) {
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }

  if (!meetings || meetings.length < 1) {
    return NextResponse.json({ error: 'No completed meetings found for this date' }, { status: 400 })
  }

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  try {
    const result = await analyzeDailyReport(meetings, profile)

    // Save the daily report
    const { data: dailyReport, error: insertError } = await supabase
      .from('daily_reports')
      .insert({
        user_id: userId,
        report_date: date,
        overall_score: result.overallScore,
        summary: result.summary,
        meeting_count: meetings.length,
        highlights: result.highlights,
        pillars: result.pillars,
        actions: result.actions,
        coach_opener: result.coachOpener,
        raw_meetings: meetings.map((m: { id: string; title: string }) => ({ id: m.id, title: m.title })),
      })
      .select()
      .single()

    if (insertError || !dailyReport) {
      return NextResponse.json({ error: 'Failed to save daily report' }, { status: 500 })
    }

    // Link each meeting to this daily report
    await supabase
      .from('meetings')
      .update({ daily_report_id: dailyReport.id })
      .in('id', meetings.map(m => m.id))

    return NextResponse.json(dailyReport)
  } catch (error) {
    console.error('Daily report analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
