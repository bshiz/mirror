-- ============================================================
-- Mirror — Supabase Database Schema
-- Run this in your Supabase SQL editor (project > SQL editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  role text not null default '',
  company text default '',
  goals text[] default '{}',
  context text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CONNECTIONS (which integrations a user has connected)
-- ============================================================
create table public.connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null, -- 'fireflies' | 'otter' | 'zoom' | 'gcal'
  access_token text,
  refresh_token text,
  webhook_id text, -- ID of the registered webhook with the provider
  connected_at timestamptz default now(),
  unique(user_id, provider)
);

-- ============================================================
-- MEETINGS
-- ============================================================
create table public.meetings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  source text not null default 'manual', -- 'fireflies' | 'otter' | 'zoom' | 'manual'
  source_id text, -- the external ID from the source provider
  title text,
  meeting_type text, -- inferred by Claude
  inferred_goal text, -- inferred by Claude
  transcript text not null,
  status text not null default 'pending', -- 'pending' | 'analyzing' | 'ready' | 'error'
  error_message text,
  occurred_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- REPORTS (one per meeting, created after analysis)
-- ============================================================
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings(id) on delete cascade not null unique,
  user_id uuid references public.profiles(id) on delete cascade not null,
  overall_score integer not null check (overall_score between 1 and 10),
  summary text not null,
  pillars jsonb not null default '[]', -- full pillar data including points + quotes
  actions text[] not null default '{}',
  coach_opener text not null default '',
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Users can only see their own data
-- ============================================================
alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.meetings enable row level security;
alter table public.reports enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Connections: users can manage their own
create policy "Users can manage own connections"
  on public.connections for all using (auth.uid() = user_id);

-- Meetings: users can manage their own
create policy "Users can manage own meetings"
  on public.meetings for all using (auth.uid() = user_id);

-- Reports: users can read their own
create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = user_id);

-- Service role can insert reports (used by webhook API route)
create policy "Service role can insert reports"
  on public.reports for insert with check (true);
create policy "Service role can update meetings"
  on public.meetings for update using (true);

-- ============================================================
-- REALTIME
-- Enable realtime on meetings so the feed updates live
-- ============================================================
alter publication supabase_realtime add table public.meetings;
alter publication supabase_realtime add table public.reports;

-- ============================================================
-- INDEXES
-- ============================================================
create index meetings_user_id_idx on public.meetings(user_id);
create index meetings_status_idx on public.meetings(status);
create index meetings_occurred_at_idx on public.meetings(occurred_at desc);
create index reports_meeting_id_idx on public.reports(meeting_id);
create index reports_user_id_idx on public.reports(user_id);
