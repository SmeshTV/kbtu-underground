-- ========================================
-- ОБНОВЛЕНИЕ TELEGRAM_USERS
-- Выполните в Supabase SQL Editor
-- ========================================

-- Удаляем старую таблицу
DROP TABLE IF EXISTS telegram_users CASCADE;

-- Создаём новую
CREATE TABLE telegram_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  telegram_id TEXT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_user ON telegram_users(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_id ON telegram_users(telegram_id);

-- RLS
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select telegram_users" ON telegram_users;
DROP POLICY IF EXISTS "Allow insert telegram_users" ON telegram_users;
DROP POLICY IF EXISTS "Allow update telegram_users" ON telegram_users;
DROP POLICY IF EXISTS "Allow delete telegram_users" ON telegram_users;

CREATE POLICY "Allow select telegram_users" ON telegram_users FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert telegram_users" ON telegram_users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update telegram_users" ON telegram_users FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete telegram_users" ON telegram_users FOR DELETE TO anon USING (true);

-- ========================================
-- ГОТОВО!
-- ========================================
