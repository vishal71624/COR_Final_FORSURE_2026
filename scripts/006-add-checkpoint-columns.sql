-- Add checkpoint columns to players table for persistent session recovery
-- Run this in your Supabase SQL editor

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS r1_checkpoints JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS r2_checkpoints JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS start_time2 BIGINT DEFAULT NULL;

-- start_time already exists and will now store R1 timeRemaining at last checkpoint
-- start_time2 stores R2 timeRemaining at last checkpoint
