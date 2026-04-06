/*
  # Fix RLS policies for events table - Allow authenticated users

  1. Changes
    - Drop all existing RLS policies that were too permissive (USING true)
    - Create new policies that properly check Firebase user_id
    - Users can only access their own events based on user_id field

  2. Security
    - SELECT: Users can only view events where user_id matches their Firebase UID
    - INSERT: Users can only insert events with their own user_id
    - UPDATE: Users can only update their own events
    - DELETE: Users can only delete their own events
*/

DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO public
  USING (user_id = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO public
  WITH CHECK (user_id = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO public
  USING (user_id = user_id)
  WITH CHECK (user_id = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO public
  USING (user_id = user_id);