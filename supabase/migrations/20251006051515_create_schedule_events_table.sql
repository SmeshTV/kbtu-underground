/*
  # Create schedule events table

  1. New Tables
    - `events`
      - `id` (uuid, primary key) - Unique event ID
      - `user_id` (text, not null) - Firebase user ID
      - `title` (text, not null) - Event title/description
      - `day_of_week` (integer, not null) - Day of week (0=Sunday, 1=Monday, etc.)
      - `start_time` (text, not null) - Start time in HH:MM format
      - `end_time` (text, not null) - End time in HH:MM format
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `events` table
    - Add policy for users to read their own events
    - Add policy for users to insert their own events
    - Add policy for users to update their own events
    - Add policy for users to delete their own events

  3. Important Notes
    - Uses Firebase UID as user_id (stored as text)
    - day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    - Times stored in 24-hour format (HH:MM)
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (user_id = current_user);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (user_id = current_user)
  WITH CHECK (user_id = current_user);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (user_id = current_user);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_day_time ON events(day_of_week, start_time);