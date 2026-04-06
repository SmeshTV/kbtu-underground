import { supabase } from '../supabase';

// Автоматическое создание таблиц при запуске
export const initDatabase = async (): Promise<boolean> => {
  console.log('🔧 Проверяю/создаю таблицы...');

  try {
    // Проверяем существуют ли таблицы
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['favorites', 'votes', 'stories', 'events']);

    if (error) {
      console.log('⚠️ Не удалось проверить таблицы');
      return false;
    }

    const existingTables = tables?.map(t => t.table_name) || [];
    const missing: string[] = [];

    if (!existingTables.includes('favorites')) missing.push('favorites');
    if (!existingTables.includes('votes')) missing.push('votes');
    if (!existingTables.includes('stories')) missing.push('stories');
    if (!existingTables.includes('events')) missing.push('events');

    if (missing.length > 0) {
      console.warn(`❌ Отсутствуют таблицы: ${missing.join(', ')}`);
      console.warn('📋 Выполните SUPABASE_FIX.sql в SQL Editor Supabase Dashboard');
      return false;
    }

    console.log('✅ Все таблицы на месте!');
    return true;
  } catch (err) {
    console.error('Ошибка проверки БД:', err);
    return false;
  }
};
