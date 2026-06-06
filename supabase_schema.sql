-- =======================================================
-- PROJECT STAR - SUPABASE SCHEMA SETUP SQL
-- Run this in the SQL Editor of your Supabase Project
-- =======================================================

-- 1. Create Couples table (referenced by profiles)
CREATE TABLE IF NOT EXISTS couples (
  id TEXT PRIMARY KEY,
  anniversary_date DATE,
  love_streak INT DEFAULT 1,
  last_streak_update DATE,
  partner_1_id TEXT NOT NULL,
  partner_2_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Create Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'other')),
  birthday DATE NOT NULL,
  zodiac_sign TEXT,
  personality TEXT,
  interests TEXT[],
  hobbies TEXT[],
  favorite_things TEXT[],
  love_language TEXT,
  couple_id TEXT REFERENCES couples(id) ON DELETE SET NULL,
  last_period_date DATE,
  average_cycle_length INT DEFAULT 28,
  average_period_duration INT DEFAULT 5,
  pms_duration INT DEFAULT 7,
  health_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Create Cycle Logs table
CREATE TABLE IF NOT EXISTS cycle_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_period BOOLEAN DEFAULT FALSE,
  flow TEXT CHECK (flow IN ('none', 'spotting', 'light', 'medium', 'heavy')),
  mood_rating INT,
  mood_emoji TEXT,
  mood_notes TEXT,
  symptoms TEXT[],
  symptoms_custom TEXT,
  energy_level INT,
  sleep_hours NUMERIC,
  water_intake INT DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, date)
);

-- 4. Create Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  couple_id TEXT REFERENCES couples(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_title TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  iv TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Create Memories table
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  couple_id TEXT REFERENCES couples(id) ON DELETE CASCADE,
  encrypted_title TEXT NOT NULL,
  encrypted_description TEXT,
  iv TEXT NOT NULL,
  photo_url TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Create Bucket List Items table
CREATE TABLE IF NOT EXISTS bucket_items (
  id TEXT PRIMARY KEY,
  couple_id TEXT REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Create Daily Questions table
CREATE TABLE IF NOT EXISTS daily_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  date DATE UNIQUE NOT NULL
);

-- 8. Create Daily Answers table
CREATE TABLE IF NOT EXISTS daily_answers (
  id TEXT PRIMARY KEY,
  question_id TEXT REFERENCES daily_questions(id) ON DELETE CASCADE,
  couple_id TEXT REFERENCES couples(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_answer TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(question_id, couple_id, user_id)
);

-- 9. Create Virtual Gifts table
CREATE TABLE IF NOT EXISTS virtual_gifts (
  id TEXT PRIMARY KEY,
  couple_id TEXT REFERENCES couples(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =======================================================
-- RLS CONFIGURATION (DISABLED FOR PROTO-ACCESS)
-- =======================================================
ALTER TABLE couples DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_gifts DISABLE ROW LEVEL SECURITY;

-- =======================================================
-- SEED DATA - DAILY QUESTIONS
-- =======================================================
INSERT INTO daily_questions (id, question, date) VALUES
('q1', 'What is your favorite memory of us together?', CURRENT_DATE),
('q2', 'What is one thing your partner did recently that made you smile?', CURRENT_DATE + INTERVAL '1 day'),
('q3', 'Describe your perfect date night in three words.', CURRENT_DATE + INTERVAL '2 days'),
('q4', 'What is a new hobby you would love to try as a couple?', CURRENT_DATE + INTERVAL '3 days'),
('q5', 'Which zodiac trait of your partner is your favorite?', CURRENT_DATE + INTERVAL '4 days'),
('q6', 'How do you feel when your partner hugs you from behind?', CURRENT_DATE + INTERVAL '5 days'),
('q7', 'What is your favorite romantic song?', CURRENT_DATE + INTERVAL '6 days')
ON CONFLICT (date) DO UPDATE SET question = EXCLUDED.question;
