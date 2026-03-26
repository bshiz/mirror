// src/app/api/cron/daily-report/route.ts
// Cron job: generates daily reports for all users with ready meetings today but no report yet.
// Schedule via Vercel cron — runs at end of day UTC.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC
  const startOfDay = `${today}T00:00:00.000Z`
  const endOfDay = `${today}T23:59:59.999Z`

  const supabase = await createServiceClient()

  // Find all users with at least one ready meeting today
  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('user_id')
    .eq('status', 'ready')
    .gte('occurred_at', startOfDay)
    .lte('occurred_at', endOfDay)

  if (meetingsError) {
    return NextResponse.json({ error: meetingsError.message }, { status: 500 })
  }

  const userIds = [...new Set((meetings || []).map((m: { user_id: string }) => m.user_id))]

  if (userIds.length === 0) {
    return NextResponse.json({ generated: 0, message: 'No eligible users today' })
  }

  // Filter out users who already have a report for today
  const { data: existingReports, error: reportsError } = await supabase
    .from('daily_reports')
    .select('user_id')
    .eq('report_date', today)
    .in('user_id', userIds)

  if (reportsError) {
    return NextResponse.json({ error: reportsError.message }, { status: 500 })
  }

  const alreadyReported = new Set((existingReports || []).map((r: { user_id: string }) => r.user_id))
  const usersNeedingReports = userIds.filter(id => !alreadyReported.has(id))

  if (usersNeedingReports.length === 0) {
    return NextResponse.json({ generated: 0, message: 'All users already have reports for today' })
  }

  // Generate a daily report for each user
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
  const results = await Promise.allSettled(
    usersNeedingReports.map(userId =>
      fetch(`${baseUrl}/api/daily-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-user-id': userId,
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ date: today, userId }),
      })
    )
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({
    generated: succeeded,
    failed,
    date: today,
    usersProcessed: usersNeedingReports.length,
  })
}
