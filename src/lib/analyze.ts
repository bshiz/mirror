// src/lib/analyze.ts
// Core feedback analysis — takes a transcript + profile, returns structured report

import Anthropic from '@anthropic-ai/sdk'
import type { Profile, AnalysisResult } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface DailyAnalysisResult {
  overallScore: number
  summary: string
  highlights: Array<{ type: 'strength' | 'gap' | 'watch'; text: string; meeting: string }>
  pillars: Array<{ name: string; icon: string; score: number; verdict: string }>
  actions: string[]
  coachOpener: string
}

export async function analyzeTranscript(
  transcript: string,
  profile: Profile
): Promise<AnalysisResult> {
  const profileCtx = `
Name: ${profile.name}
Role: ${profile.role}
Company: ${profile.company || 'Not specified'}
Growth goals: ${profile.goals?.join(', ') || 'Not specified'}
Additional context: ${profile.context || 'None'}`.trim()

  const system = `You are Mirror, a brutally honest personal feedback coach.

You know this person well:
${profileCtx}

Instructions:
- Infer the meeting type and the user's likely goal from the transcript — do not ask for them
- Address ${profile.name} by name in your feedback
- Reference their stated growth goals when relevant
- Be direct. Don't soften hard truths
- Cite exact quotes from the transcript as evidence
- No generic advice — every point must be grounded in this specific meeting

Return ONLY raw JSON (no markdown, no backticks, no explanation):
{
  "meetingTitle": "brief descriptive title",
  "meetingType": "inferred meeting type e.g. Cross-functional sync",
  "inferredGoal": "inferred goal in one sentence",
  "overallScore": 6,
  "summary": "direct 2-3 sentence executive summary addressing ${profile.name} directly",
  "pillars": [
    {
      "name": "Communication Clarity",
      "icon": "💬",
      "score": 6,
      "tagline": "short brutal one-line verdict",
      "verdict": "2-3 sentence assessment",
      "points": [
        { "type": "strength", "text": "specific observation", "quote": "exact quote or empty string" },
        { "type": "gap", "text": "specific observation", "quote": "exact quote or empty string" },
        { "type": "watch", "text": "specific observation", "quote": "exact quote or empty string" }
      ]
    },
    {
      "name": "Leadership & Influence",
      "icon": "⚡",
      "score": 5,
      "tagline": "...",
      "verdict": "...",
      "points": [...]
    },
    {
      "name": "Strategic Thinking",
      "icon": "♟",
      "score": 6,
      "tagline": "...",
      "verdict": "...",
      "points": [...]
    }
  ],
  "actions": [
    "Specific action 1 for next meeting",
    "Specific action 2",
    "Specific action 3"
  ],
  "coachOpener": "Direct 1-2 sentence opener using ${profile.name}'s name, referencing a specific moment from the meeting."
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system,
    messages: [{ role: 'user', content: `Analyze this transcript:\n\n${transcript}` }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as AnalysisResult
}

export async function analyzeDailyReport(
  meetings: Array<{ id: string; title: string | null; transcript: string; occurred_at: string }>,
  profile: Profile
): Promise<DailyAnalysisResult> {
  const system = `You are Mirror, a brutally honest personal feedback coach. You are synthesizing a full day of meetings for ${profile.name}, who is a ${profile.role} at ${profile.company || 'their company'}. Their growth goals are ${profile.goals?.join(', ') || 'not specified'}. Be direct, address them by name, no softening.

Return ONLY raw JSON (no markdown, no backticks, no explanation):
{
  "overallScore": 7,
  "summary": "2-3 sentence day summary addressing ${profile.name} directly",
  "highlights": [
    { "type": "strength", "text": "specific observation", "meeting": "meeting title" },
    { "type": "gap", "text": "specific observation", "meeting": "meeting title" },
    { "type": "watch", "text": "specific observation", "meeting": "meeting title" }
  ],
  "pillars": [
    { "name": "Communication Clarity", "icon": "💬", "score": 7, "verdict": "2-3 sentence assessment across all meetings" },
    { "name": "Leadership & Influence", "icon": "⚡", "score": 6, "verdict": "2-3 sentence assessment across all meetings" },
    { "name": "Strategic Thinking", "icon": "♟", "score": 7, "verdict": "2-3 sentence assessment across all meetings" }
  ],
  "actions": [
    "Specific action 1 for tomorrow",
    "Specific action 2",
    "Specific action 3"
  ],
  "coachOpener": "Direct 1-2 sentence opener about ${profile.name}'s day."
}`

  const userContent = meetings
    .map((m, i) => `Meeting ${i + 1}: ${m.title || 'Untitled'} at ${m.occurred_at}\n${m.transcript}`)
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system,
    messages: [{ role: 'user', content: `Analyze this full day of meetings:\n\n${userContent}` }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as DailyAnalysisResult
}
