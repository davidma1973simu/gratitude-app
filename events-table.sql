-- Gratitude App — Events Table
-- Run this SQL in Supabase → SQL Editor to enable behavior analytics
--
-- This table logs user behavior events (NOT content):
--   session_start, entry_submitted, history_opened,
--   reunion_opened, card_generated, card_saved, pwa_install_prompt

CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_events_user ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event ON public.events(event);
CREATE INDEX IF NOT EXISTS idx_events_created ON public.events(created_at DESC);

-- Row Level Security: users can only read their own events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own events"
  ON public.events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Helper: daily active users
-- SELECT COUNT(DISTINCT user_id) FROM events WHERE event = 'session_start' AND created_at::date = CURRENT_DATE;

-- Helper: feature usage
-- SELECT event, COUNT(*) as cnt FROM events WHERE created_at > now() - interval '30 days' GROUP BY event ORDER BY cnt DESC;

-- Helper: retention (users who submitted at least 2 entries)
-- SELECT user_id, COUNT(DISTINCT (created_at::date)) as active_days
-- FROM events WHERE event = 'entry_submitted'
-- GROUP BY user_id ORDER BY active_days DESC;
