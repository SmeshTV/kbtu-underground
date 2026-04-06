-- ========================================
-- ТАБЛИЦА CONNECT CODES
-- Выполните в Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS connect_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_connect_code ON connect_codes(code);

-- Автоудаление просроченных кодов каждые 10 мин
-- (можно настроить pg_cron)

-- RLS
ALTER TABLE connect_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select connect_codes" ON connect_codes;
DROP POLICY IF EXISTS "Allow insert connect_codes" ON connect_codes;
DROP POLICY IF EXISTS "Allow update connect_codes" ON connect_codes;
DROP POLICY IF EXISTS "Allow delete connect_codes" ON connect_codes;

CREATE POLICY "Allow select connect_codes" ON connect_codes FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert connect_codes" ON connect_codes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update connect_codes" ON connect_codes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete connect_codes" ON connect_codes FOR DELETE TO anon USING (true);

-- ========================================
-- ГОТОВО!
-- ========================================
