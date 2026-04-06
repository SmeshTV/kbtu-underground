-- Создаём таблицу stories для историй
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_at DESC);

-- Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view all stories"
  ON stories FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own stories"
  ON stories FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (user_id = auth.uid()::text);
