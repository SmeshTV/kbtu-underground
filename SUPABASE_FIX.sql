-- ========================================
-- Выполните этот SQL в Supabase Dashboard
-- ========================================
-- 1. Откройте: https://app.supabase.com
-- 2. Выберите ваш проект
-- 3. Перейдите в SQL Editor
-- 4. Скопируйте и выполните весь этот файл
-- ========================================

-- 1. Исправить RLS политики для favorites
-- ---------------------------------------
-- Удаляем старую политику INSERT
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;

-- Создаём новую политику, которая разрешает вставку аутентифицированным пользователям
CREATE POLICY "Allow insert favorites for authenticated users"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Также разрешаем анонимным пользователям (если нужно)
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
CREATE POLICY "Allow insert favorites"
  ON favorites FOR INSERT
  TO anon
  WITH CHECK (true);

-- 2. Исправить RLS политики для votes
-- ------------------------------------
DROP POLICY IF EXISTS "Users can insert their own votes" ON votes;
CREATE POLICY "Allow insert votes"
  ON votes FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own votes" ON votes;
CREATE POLICY "Allow view votes"
  ON votes FOR SELECT
  TO anon
  USING (true);

-- 3. Исправить RLS политики для stories
-- --------------------------------------
DROP POLICY IF EXISTS "Users can insert their own stories" ON stories;
CREATE POLICY "Allow insert stories"
  ON stories FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view stories" ON stories;
CREATE POLICY "Allow view stories"
  ON stories FOR SELECT
  TO anon
  USING (true);

-- 4. Исправить RLS политики для events
-- -------------------------------------
-- Проверяем существует ли таблица
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
    -- Создаём таблицу events если её нет
    CREATE TABLE events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Включаем RLS
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Таблица events создана';
  ELSE
    RAISE NOTICE 'Таблица events уже существует';
  END IF;
END $$;

-- Создаём политики для events
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

CREATE POLICY "Allow view events"
  ON events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow insert events"
  ON events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow update events"
  ON events FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete events"
  ON events FOR DELETE
  TO anon
  USING (true);

-- ========================================
-- После выполнения проверьте:
-- ✅ Все операции с favorites работают
-- ✅ Таблица events доступна
-- ✅ Голоса и истории сохраняются
-- ========================================
