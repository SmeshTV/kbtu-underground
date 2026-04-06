import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://apscalhpulmyasqxwxis.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2NhbGhwdWxteWFzcXh3eGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDU3NzYsImV4cCI6MjA5MDk4MTc3Nn0.Cta44JWPkMSqVNrY00FGHSHiDb8gOuMqv7aKkRnjWJg";

console.log('🔑 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Key (partial):', supabaseAnonKey.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Event {
  id: string;
  user_id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Новые поля
  event_date?: string; // "YYYY-MM-DD" для одноразовых
  recurrence?: 'none' | 'weekly'; // одноразовое или еженедельное
  alarm_time?: string; // "HH:MM" будильник
  alarm_enabled?: boolean;
}

export interface Favorite {
  id: string;
  user_id: string;
  item_type: 'question' | 'category';
  item_id: string;
  item_data: any;
  created_at: string;
}

// Get all favorites for a user
export const getFavorites = async (userId: string): Promise<Favorite[]> => {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
  return data || [];
};

// Add a favorite
export const addFavorite = async (userId: string, itemType: 'question' | 'category', itemId: string, itemData: any): Promise<Favorite | null> => {
  const { data, error } = await supabase
    .from('favorites')
    .upsert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      item_data: itemData,
    }, { onConflict: 'user_id,item_type,item_id' })
    .select()
    .single();

  if (error) {
    console.error('Error adding favorite:', error);
    return null;
  }
  return data;
};

// Remove a favorite
export const removeFavorite = async (userId: string, itemType: 'question' | 'category', itemId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
  return true;
};

// Clear all favorites for a user
export const clearFavorites = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error clearing favorites:', error);
    return false;
  }
  return true;
};

// ===== VOTES =====
export interface Vote {
  id: string;
  user_id: string;
  question_title: string;
  vote_type: 'like' | 'dislike';
  created_at: string;
  updated_at: string;
}

// Get all votes (for counting likes/dislikes)
export const getAllVotes = async (): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching votes:', error);
    return [];
  }
  return data || [];
};

// Get all votes for a specific user
export const getUserVotes = async (userId: string): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user votes:', error);
    return [];
  }
  return data || [];
};

// Get user's vote for a question
export const getUserVote = async (userId: string, questionTitle: string): Promise<'like' | 'dislike' | null> => {
  const { data, error } = await supabase
    .from('votes')
    .select('vote_type')
    .eq('user_id', userId)
    .eq('question_title', questionTitle)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user vote:', error);
  }
  return data?.vote_type || null;
};

// Submit or update vote
export const submitVote = async (userId: string, questionTitle: string, voteType: 'like' | 'dislike'): Promise<boolean> => {
  const { error } = await supabase
    .from('votes')
    .upsert({
      user_id: userId,
      question_title: questionTitle,
      vote_type: voteType,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,question_title' });

  if (error) {
    console.error('Error submitting vote:', error);
    return false;
  }
  return true;
};

// Remove user's vote
export const removeVote = async (userId: string, questionTitle: string): Promise<boolean> => {
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('user_id', userId)
    .eq('question_title', questionTitle);

  if (error) {
    console.error('Error removing vote:', error);
    return false;
  }
  return true;
};

// Calculate total likes/dislikes for a question
export const getQuestionVotes = async (questionTitle: string): Promise<{ likes: number; dislikes: number }> => {
  const { data, error } = await supabase
    .from('votes')
    .select('vote_type')
    .eq('question_title', questionTitle);

  if (error) {
    console.error('Error calculating votes:', error);
    return { likes: 0, dislikes: 0 };
  }

  const likes = data?.filter(v => v.vote_type === 'like').length || 0;
  const dislikes = data?.filter(v => v.vote_type === 'dislike').length || 0;
  return { likes, dislikes };
};

// ===== STORIES =====
export interface Story {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
}

// Get all stories
export const getStories = async (): Promise<Story[]> => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
  return data || [];
};

// Add a story
export const addStory = async (userId: string, text: string): Promise<Story | null> => {
  const { data, error } = await supabase
    .from('stories')
    .insert({ user_id: userId, text })
    .select()
    .single();

  if (error) {
    console.error('Error adding story:', error);
    return null;
  }
  return data;
};

// Delete a story
export const deleteStory = async (storyId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId);

  if (error) {
    console.error('Error deleting story:', error);
    return false;
  }
  return true;
};
