// src/types/index.ts

export type MeetingStatus = 'pending' | 'analyzing' | 'ready' | 'error'
export type MeetingSource = 'fireflies' | 'otter' | 'zoom' | 'manual'
export type ConnectionProvider = 'fireflies' | 'otter' | 'zoom' | 'gcal'

export interface Profile {
  id: string
  name: string
  role: string
  company: string
  goals: string[]
  context: string
  created_at: string
  updated_at: string
}

export interface Connection {
  id: string
  user_id: string
  provider: ConnectionProvider
  connected_at: string
}

export interface Meeting {
  id: string
  user_id: string
  source: MeetingSource
  source_id: string | null
  title: string | null
  meeting_type: string | null
  inferred_goal: string | null
  transcript: string
  status: MeetingStatus
  error_message: string | null
  occurred_at: string
  created_at: string
  updated_at: string
  report?: Report // joined when fetching
}

export type FeedbackPointType = 'strength' | 'gap' | 'watch'

export interface FeedbackPoint {
  type: FeedbackPointType
  text: string
  quote: string
}

export interface Pillar {
  name: string
  icon: string
  score: number
  tagline: string
  verdict: string
  points: FeedbackPoint[]
}

export interface Report {
  id: string
  meeting_id: string
  user_id: string
  overall_score: number
  summary: string
  pillars: Pillar[]
  actions: string[]
  coach_opener: string
  created_at: string
}

// What Claude returns from analysis
export interface AnalysisResult {
  meetingTitle: string
  meetingType: string
  inferredGoal: string
  overallScore: number
  summary: string
  pillars: Pillar[]
  actions: string[]
  coachOpener: string
}
