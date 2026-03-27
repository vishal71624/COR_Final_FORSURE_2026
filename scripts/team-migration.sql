-- Run this in your Supabase SQL editor to enable team mode

-- 1. Teams table: admin creates teams with a shared code
CREATE TABLE IF NOT EXISTS teams (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  player1_name TEXT NOT NULL,
  player2_name TEXT,
  player1_joined BOOLEAN DEFAULT FALSE NOT NULL,
  player2_joined BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add team support columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS team_code TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS player_slot INTEGER DEFAULT 1;

-- 3. Index for team lookups
CREATE INDEX IF NOT EXISTS idx_players_team_code ON players(team_code);
