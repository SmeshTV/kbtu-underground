import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, FileText, Edit as EditIcon, AlarmClock, Repeat, CalendarDays } from 'lucide-react';
import { supabase, Event } from '../supabase';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  dayOfWeek: number;
  startTime: string;
  userId: string;
  onSave: () => void;
  color?: string;
  onColorChange?: (color: string) => void;
  colorOptions?: string[];
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen, onClose, event, dayOfWeek, startTime, userId, onSave,
  color: initialColor, onColorChange, colorOptions = [],
}) => {
  const [isEditMode, setIsEditMode] = useState(!event);
  const [title, setTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState(dayOfWeek);
  const [startTimeVal, setStartTimeVal] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<'none' | 'weekly'>('weekly');
  const [eventDate, setEventDate] = useState('');
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState(initialColor || '');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  // Получаем сегодняшнюю дату в формате YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setSelectedDay(event.day_of_week);
      setStartTimeVal(event.start_time);
      setEndTime(event.end_time);
      setNotes(event.notes || '');
      setRecurrence(event.recurrence || 'weekly');
      setEventDate(event.event_date || '');
      setAlarmTime(event.alarm_time || '');
      setAlarmEnabled(event.alarm_enabled || false);
      setIsEditMode(false);
    } else {
      setTitle('');
      setSelectedDay(dayOfWeek);
      const safe = typeof startTime === 'string' ? startTime : '09:00';
      setStartTimeVal(safe);
      const [h, m] = safe.split(':');
      setEndTime(`${(parseInt(h) + 1).toString().padStart(2, '0')}:${m}`);
      setNotes('');
      setRecurrence('weekly');
      setEventDate(todayStr);
      setAlarmTime('');
      setAlarmEnabled(false);
      setIsEditMode(true);
    }
    setError('');
    if (initialColor) setSelectedColor(initialColor);
  }, [event, startTime, dayOfWeek, initialColor]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (event) {
        const { error: updErr } = await supabase.from('events').update({
          title, day_of_week: selectedDay, start_time: startTimeVal,
          end_time: endTime, notes, recurrence,
          event_date: recurrence === 'none' ? eventDate : null,
          alarm_time: alarmTime || null,
          alarm_enabled: alarmTime ? alarmEnabled : false,
          updated_at: new Date().toISOString(),
        }).eq('id', event.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('events').insert({
          user_id: userId, title, day_of_week: selectedDay,
          start_time: startTimeVal, end_time: endTime, notes,
          recurrence,
          event_date: recurrence === 'none' ? eventDate : null,
          alarm_time: alarmTime || null,
          alarm_enabled: alarmTime ? alarmEnabled : false,
        });
        if (insErr) throw insErr;
      }
      onSave();
    } catch (err: any) {
      console.error('Event save error:', err);
      setError(err.message || 'Ошибка сохранения.');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm('Удалить это событие?')) return;
    setLoading(true);
    try {
      await supabase.from('events').delete().eq('id', event.id);
      onSave();
    } catch (err: any) { setError('Ошибка удаления.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative max-w-lg w-full bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              {event && !isEditMode ? event.title : (event ? 'Редактировать' : 'Новое событие')}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {event && !isEditMode && (
              <button onClick={() => setIsEditMode(true)} className="text-gray-400 hover:text-cyan-400 p-2 hover:bg-gray-700 rounded-lg"><EditIcon className="w-5 h-5" /></button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {isEditMode ? (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Название</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                placeholder="Например: Лекция по физике" required disabled={loading} />
            </div>

            {/* Day + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">День недели</label>
                <select value={selectedDay} onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500" disabled={loading}>
                  {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Начало</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="time" value={startTimeVal} onChange={(e) => setStartTimeVal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500" required disabled={loading} />
                </div>
              </div>
            </div>

            {/* End time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Окончание</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500" required disabled={loading} />
              </div>
            </div>

            {/* Recurrence type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Повторение</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRecurrence('weekly')}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    recurrence === 'weekly' ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-600 text-gray-400'
                  }`}>
                  <Repeat className="w-4 h-4" />
                  <span className="text-sm">Еженедельно</span>
                </button>
                <button type="button" onClick={() => setRecurrence('none')}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    recurrence === 'none' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400' : 'bg-gray-800 border-gray-600 text-gray-400'
                  }`}>
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-sm">Один раз</span>
                </button>
              </div>
            </div>

            {/* Date for one-time events */}
            {recurrence === 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Дата</label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  required disabled={loading} />
              </div>
            )}

            {/* Alarm */}
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlarmClock className="w-4 h-4 text-yellow-400" />
                <label className="text-sm font-medium text-gray-300">Будильник</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="time" value={alarmTime} onChange={(e) => { setAlarmTime(e.target.value); if (e.target.value) setAlarmEnabled(true); }}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={alarmEnabled} onChange={(e) => setAlarmEnabled(e.target.checked)}
                    className="w-4 h-4" disabled={!alarmTime} />
                  Вкл
                </label>
              </div>
              <p className="text-xs text-gray-500">Будильник будет звонить пока не выключите на сайте</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Заметки</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Дополнительная информация..." rows={3} disabled={loading} />
              </div>
            </div>

            {/* Color */}
            {colorOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Цвет</label>
                <div className="flex items-center gap-2">
                  <div onClick={() => setShowColorPicker(!showColorPicker)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedColor} cursor-pointer border-2 border-white/20 hover:scale-110 transition-transform`} />
                  <span className="text-xs text-gray-400">Выбрать цвет</span>
                </div>
                {showColorPicker && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {colorOptions.map((c, i) => (
                      <div key={i} onClick={() => { setSelectedColor(c); onColorChange?.(c); setShowColorPicker(false); }}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} cursor-pointer border-2 ${selectedColor === c ? 'border-white scale-110' : 'border-transparent'} hover:scale-110 transition-transform`} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3">
              <button type="submit" disabled={loading}
                className="flex-1 py-2 px-4 rounded-lg font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50">
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
              {event && (
                <button type="button" onClick={handleDelete} disabled={loading}
                  className="py-2 px-4 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                  Удалить
                </button>
              )}
            </div>
          </form>
        ) : (
          /* View mode */
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">День</div>
                <div className="text-white font-medium">{dayNames[selectedDay]}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Время</div>
                <div className="text-white font-medium">{startTimeVal} — {endTime}</div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">Повторение</div>
              <div className="text-white font-medium flex items-center gap-2">
                {recurrence === 'weekly' ? <><Repeat className="w-4 h-4" /> Еженедельно</> : <><CalendarDays className="w-4 h-4" /> Один раз ({eventDate})</>}
              </div>
            </div>
            {alarmTime && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Будильник</div>
                <div className="text-yellow-400 font-medium flex items-center gap-2">
                  <AlarmClock className="w-4 h-4" /> {alarmTime} {alarmEnabled ? '(вкл)' : '(выкл)'}
                </div>
              </div>
            )}
            {notes && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Заметки</div>
                <div className="text-white whitespace-pre-wrap">{notes}</div>
              </div>
            )}
            <button onClick={() => setIsEditMode(true)}
              className="w-full py-2 rounded-lg font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
              Редактировать
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventModal;
