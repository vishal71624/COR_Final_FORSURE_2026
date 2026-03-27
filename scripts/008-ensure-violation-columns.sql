-- Ensure all 4 violation-tracking columns exist on the players table.
-- Safe to run multiple times (uses IF NOT EXISTS).
--
-- tab_switch_count      = Round 1 tab switches       (max 2 → disqualified)
-- full_scrn_exit_count  = Round 1 fullscreen exits   (max 2 → disqualified)
-- tab_switch_count2     = Round 2 tab switches        (max 2 → disqualified)
-- full_scrn_exit_count2 = Round 2 fullscreen exits    (max 2 → disqualified)

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS tab_switch_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS full_scrn_exit_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tab_switch_count2     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS full_scrn_exit_count2 INTEGER NOT NULL DEFAULT 0;
