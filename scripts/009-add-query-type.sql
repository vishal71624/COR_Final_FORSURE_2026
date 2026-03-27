-- Migration: Add 'query' as a valid question type
-- Run this in Supabase SQL Editor

-- Drop old CHECK constraint and add new one that includes 'query'
ALTER TABLE round1_questions
  DROP CONSTRAINT IF EXISTS round1_questions_type_check;

ALTER TABLE round1_questions
  ADD CONSTRAINT round1_questions_type_check
    CHECK (type IN ('mcq', 'query', 'scenario'));
