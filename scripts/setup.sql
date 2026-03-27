-- ============================================================
-- ITRIX 2026: COMMIT OR ROLLBACK  --  Full Database Setup
-- Run this once in your Supabase SQL editor.
-- No RLS / policies needed: the app uses server-side actions
-- with the anon key and there is no per-user auth.
-- ============================================================


-- ── players ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id                   TEXT        PRIMARY KEY,
  name                 TEXT        NOT NULL,
  college              TEXT,
  department           TEXT,
  year_of_study        TEXT,
  contact_number       TEXT,
  email                TEXT,
  score                INTEGER     NOT NULL DEFAULT 0,
  round1_score         INTEGER     NOT NULL DEFAULT 0,
  round2_score         INTEGER     NOT NULL DEFAULT 0,
  round1_completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  round2_enabled       BOOLEAN     NOT NULL DEFAULT FALSE,
  round2_completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  -- proctoring violation counters (max 2 each → disqualified)
  tab_switch_count     INTEGER     NOT NULL DEFAULT 0,   -- R1 tab switches
  full_scrn_exit_count INTEGER     NOT NULL DEFAULT 0,   -- R1 fullscreen exits
  tab_switch_count2    INTEGER     NOT NULL DEFAULT 0,   -- R2 tab switches
  full_scrn_exit_count2 INTEGER    NOT NULL DEFAULT 0,   -- R2 fullscreen exits
  window_button_count  INTEGER     NOT NULL DEFAULT 0,   -- R1 window-button presses
  window_button_count2 INTEGER     NOT NULL DEFAULT 0,   -- R2 window-button presses
  is_disqualified      BOOLEAN     NOT NULL DEFAULT FALSE,
  round1_answers       JSONB                DEFAULT '{}'::jsonb,
  -- checkpoint / timer recovery
  r1_checkpoints       JSONB                DEFAULT NULL,
  r2_checkpoints       JSONB                DEFAULT NULL,
  start_time           BIGINT               DEFAULT NULL, -- R1 time remaining (ms)
  start_time2          BIGINT               DEFAULT NULL, -- R2 time remaining (ms)
  -- team support
  team_code            TEXT                 DEFAULT NULL,
  player_slot          INTEGER              DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_score          ON players (score DESC);
CREATE INDEX IF NOT EXISTS idx_players_disqualified   ON players (is_disqualified);
CREATE INDEX IF NOT EXISTS idx_players_team_code      ON players (team_code);


-- ── teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  code            TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL,
  player1_name    TEXT        NOT NULL,
  player2_name    TEXT,
  player1_joined  BOOLEAN     NOT NULL DEFAULT FALSE,
  player2_joined  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── round1_questions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS round1_questions (
  id             SERIAL      PRIMARY KEY,
  type           VARCHAR(20) NOT NULL DEFAULT 'mcq'
                   CHECK (type IN ('mcq', 'query', 'scenario')),
  difficulty     VARCHAR(10) NOT NULL
                   CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question       TEXT        NOT NULL,
  scenario       TEXT,
  options        JSONB       NOT NULL DEFAULT '[]',
  correct_answer INTEGER     NOT NULL,
  points         INTEGER     NOT NULL DEFAULT 10,
  is_active      BOOLEAN              DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_round1_questions_difficulty ON round1_questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_round1_questions_active     ON round1_questions (is_active);


-- ── round2_challenges ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS round2_challenges (
  id               SERIAL       PRIMARY KEY,
  difficulty       VARCHAR(10)  NOT NULL
                     CHECK (difficulty IN ('easy', 'medium', 'hard')),
  title            VARCHAR(255) NOT NULL,
  description      TEXT         NOT NULL,
  scenario         TEXT,
  schema           TEXT,
  base_table_data  JSONB        NOT NULL DEFAULT '[]',
  test_cases       JSONB        NOT NULL DEFAULT '[]',
  expected_keywords JSONB                DEFAULT '[]',
  total_points     INTEGER      NOT NULL DEFAULT 15,
  time_limit       INTEGER      NOT NULL DEFAULT 180,
  correct_query    TEXT,
  is_active        BOOLEAN               DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_round2_challenges_difficulty ON round2_challenges (difficulty);
CREATE INDEX IF NOT EXISTS idx_round2_challenges_active     ON round2_challenges (is_active);
