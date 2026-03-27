-- Add separate violation tracking columns for Round 1 and Round 2
-- Run this in your Supabase SQL editor

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS full_scrn_exit_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tab_switch_count2      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS full_scrn_exit_count2  INTEGER NOT NULL DEFAULT 0;

-- tab_switch_count already exists and now tracks Round 1 tab switches only
-- full_scrn_exit_count  = Round 1 fullscreen exits   (max 2 → disqualified)
-- tab_switch_count2     = Round 2 tab switches        (max 2 → disqualified)
-- full_scrn_exit_count2 = Round 2 fullscreen exits    (max 2 → disqualified)
