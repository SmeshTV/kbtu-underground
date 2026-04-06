-- Создаём таблицу votes для лайков/дизлайков
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_title TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_title)
);

CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_question ON votes(question_title);

-- Row Level Security
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON votes FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own votes"
  ON votes FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own votes"
  ON votes FOR DELETE
  USING (user_id = auth.uid()::text);
