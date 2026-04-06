-- ========================================
-- ТАБЛИЦА ДЛЯ PUSH TOKENS
-- Выполните в Supabase SQL Editor
-- ========================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform TEXT DEFAULT 'web',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- RLS политики
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select push_tokens" ON push_tokens;
DROP POLICY IF EXISTS "Allow insert push_tokens" ON push_tokens;
DROP POLICY IF EXISTS "Allow update push_tokens" ON push_tokens;
DROP POLICY IF EXISTS "Allow delete push_tokens" ON push_tokens;

CREATE POLICY "Allow select push_tokens" ON push_tokens FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert push_tokens" ON push_tokens FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update push_tokens" ON push_tokens FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete push_tokens" ON push_tokens FOR DELETE TO anon USING (true);

-- ========================================
-- ГОТОВО! Теперь push токены сохраняются
-- ========================================
