-- ========================================
-- ОБНОВЛЕНИЕ ТАБЛИЦЫ EVENTS
-- Выполните в Supabase SQL Editor
-- ========================================

-- Добавляем новые колонки
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'weekly';
ALTER TABLE events ADD COLUMN IF NOT EXISTS alarm_time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS alarm_enabled BOOLEAN DEFAULT false;

-- Для существующих событий ставим weekly по умолчанию
UPDATE events SET recurrence = 'weekly' WHERE recurrence IS NULL;

-- Убеждаемся что политики работают
DROP POLICY IF EXISTS "Allow select events" ON events;
DROP POLICY IF EXISTS "Allow insert events" ON events;
DROP POLICY IF EXISTS "Allow update events" ON events;
DROP POLICY IF EXISTS "Allow delete events" ON events;

CREATE POLICY "Allow select events" ON events FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert events" ON events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update events" ON events FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete events" ON events FOR DELETE TO anon USING (true);

-- ========================================
-- ГОТОВО! Новые поля:
-- event_date - дата для одноразовых ("2026-04-06")
-- recurrence - "none" (один раз) или "weekly" (каждую неделю)
-- alarm_time - время будильника ("08:30")
-- alarm_enabled - включён ли будильник
-- ========================================
