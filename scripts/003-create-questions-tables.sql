-- Drop unused tables (students and student_performance are redundant with players table)
DROP TABLE IF EXISTS student_performance CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Create round1_questions table for MCQ questions
CREATE TABLE IF NOT EXISTS round1_questions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'mcq' CHECK (type IN ('mcq', 'scenario')),
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question TEXT NOT NULL,
  scenario TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create round2_challenges table for SQL challenges
CREATE TABLE IF NOT EXISTS round2_challenges (
  id SERIAL PRIMARY KEY,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  scenario TEXT,
  schema TEXT,
  base_table_data JSONB NOT NULL DEFAULT '[]',
  test_cases JSONB NOT NULL DEFAULT '[]',
  expected_keywords JSONB DEFAULT '[]',
  total_points INTEGER NOT NULL DEFAULT 15,
  time_limit INTEGER NOT NULL DEFAULT 180,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_round1_questions_difficulty ON round1_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_round1_questions_active ON round1_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_round2_challenges_difficulty ON round2_challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_round2_challenges_active ON round2_challenges(is_active);
