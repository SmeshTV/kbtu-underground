-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('question', 'category')),
  item_id TEXT NOT NULL,
  item_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_type ON favorites(user_id, item_type);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policies: users can only see/modify their own favorites
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own favorites"
  ON favorites FOR UPDATE
  USING (user_id = auth.uid()::text);
