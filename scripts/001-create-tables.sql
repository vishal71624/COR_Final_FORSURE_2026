-- Create students table for storing student information
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  college VARCHAR(255),
  department VARCHAR(255),
  year_of_study VARCHAR(50),
  contact_number VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_performance table for tracking competition progress
CREATE TABLE IF NOT EXISTS student_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  round1_score INTEGER DEFAULT 0,
  round2_score INTEGER DEFAULT 0,
  round1_completed BOOLEAN DEFAULT FALSE,
  round2_enabled BOOLEAN DEFAULT FALSE,
  round2_completed BOOLEAN DEFAULT FALSE,
  tab_switch_count INTEGER DEFAULT 0,
  is_disqualified BOOLEAN DEFAULT FALSE,
  round1_answers JSONB DEFAULT '{}',
  start_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Create legacy players table for backward compatibility
CREATE TABLE IF NOT EXISTS players (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  college VARCHAR(255),
  department VARCHAR(255),
  year_of_study VARCHAR(50),
  contact_number VARCHAR(20),
  email VARCHAR(255),
  score INTEGER DEFAULT 0,
  round1_score INTEGER DEFAULT 0,
  round2_score INTEGER DEFAULT 0,
  round1_completed BOOLEAN DEFAULT FALSE,
  round2_enabled BOOLEAN DEFAULT FALSE,
  round2_completed BOOLEAN DEFAULT FALSE,
  tab_switch_count INTEGER DEFAULT 0,
  is_disqualified BOOLEAN DEFAULT FALSE,
  round1_answers JSONB DEFAULT '{}',
  start_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_student_performance_student_id ON student_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC);
