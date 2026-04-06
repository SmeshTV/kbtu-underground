import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Clock, Plus, Trash2, Bell, BellOff, Timer, AlarmClock, X } from 'lucide-react';
import { supabase, Event } from '../supabase';
import EventModal from './EventModal';
import { User } from 'firebase/auth';

interface ScheduleProps {
  user: User;
}

type ViewMode = 'table' | 'cards';

const Schedule: React.FC<ScheduleProps> = ({ user }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);
  const [editAlarmEvent, setEditAlarmEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  // Timer
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [timerFinished, setTimerFinished] = useState(false);

  // Alarm
  const [alarmRinging, setAlarmRinging] = useState<Event | null>(null);
  const [alarmMessage, setAlarmMessage] = useState('');
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmFiredRef = useRef<Set<string>>(new Set());

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayNamesFull = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const colorOptions = [
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-yellow-500 to-orange-600',
    'from-indigo-500 to-purple-600',
  ];

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => {
    const saved = localStorage.getItem(`schedule_colors_${user.uid}`);
    if (saved) setColorMap(JSON.parse(saved));
  }, [user.uid]);

  // Register for push notifications + upcoming checks
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Register periodic sync for Android
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        if ('periodicSync' in reg) {
          reg.periodicSync.register({
            tag: 'check-upcoming',
            minInterval: 15 * 60 * 1000, // 15 min
          }).catch(() => {
            console.log('[SW] Periodic sync not supported');
          });
        }
      }).catch(() => {});

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CHECK_UPCOMING') {
          checkUpcomingAndNotify();
        }
      });
    }
  }, []);

  // Check upcoming events and alarms + show notifications
  const checkUpcomingAndNotify = () => {
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7;
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (currentDay !== todayIndex) return;

    const todayEvents = eventsByDay[todayIndex] || [];

    // Check alarms first
    events.forEach(e => {
      if (!e.alarm_enabled || !e.alarm_time) return;
      if (timeStr === e.alarm_time && !alarmFiredRef.current.has(e.id)) {
        alarmFiredRef.current.add(e.id);
        setAlarmRinging(e);
        setAlarmMessage(`⏰ Будильник: ${e.title}`);
        playAlarmSound();
        // Отключить после срабатывания
        supabase.from('events').update({ alarm_enabled: false }).eq('id', e.id);
      }
    });

    // Check upcoming notifications
    todayEvents.forEach(event => {
      if (!event.start_time) return;
      const [sh, sm] = event.start_time.split(':').map(Number);
      const eventStart = sh * 60 + sm;
      const diff = eventStart - curMinutes;

      if (diff === 5) showUpcomingNotification(event, 'soon');
      if (diff === 0) showUpcomingNotification(event, 'started');

      if (event.end_time) {
        const [eh, em] = event.end_time.split(':').map(Number);
        const eventEnd = eh * 60 + em;
        if (curMinutes === eventEnd) showUpcomingNotification(event, 'ended');
      }
    });
  };

  const showUpcomingNotification = (event: Event, type: 'soon' | 'started' | 'ended') => {
    const key = `${event.id}-${type}-${new Date().toDateString()}`;
    if (localStorage.getItem(`notified-${key}`)) return;
    localStorage.setItem(`notified-${key}`, '1');

    const messages = {
      soon: `⏰ Через 5 мин: ${event.title}`,
      started: `🔴 Началось: ${event.title}`,
      ended: `✅ Закончилось: ${event.title}`,
    };

    if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(messages[type], {
          body: `${formatTime(event.start_time)} — ${formatTime(event.end_time)}`,
          icon: '/icon-192.svg',
          tag: `${type}-${event.id}`,
          requireInteraction: type === 'started',
        });
      }).catch(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(messages[type], { body: `${formatTime(event.start_time)} — ${formatTime(event.end_time)}` });
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(messages[type], { body: `${formatTime(event.start_time)} — ${formatTime(event.end_time)}` });
    }
  };

  // ===== AUTO-CLEAN OLD EVENTS =====
  const cleanupOldEvents = async () => {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const oldOneTime = events.filter(e =>
      e.recurrence === 'none' && e.event_date && e.event_date < cutoffStr
    );

    if (oldOneTime.length > 0) {
      for (const e of oldOneTime) {
        await supabase.from('events').delete().eq('id', e.id);
      }
      setEvents(prev => prev.filter(e => e.recurrence !== 'none' || !e.event_date || e.event_date >= cutoffStr));
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.uid)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      setEvents(data || []);
      setTimeout(cleanupOldEvents, 2000);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally { setLoading(false); }
  };

  // Группировка по дням
  const eventsByDay = useMemo(() => {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const grouped: Record<number, Event[]> = {};
    events.forEach(e => {
      if (e.recurrence === 'weekly' || !e.recurrence) {
        if (!grouped[e.day_of_week]) grouped[e.day_of_week] = [];
        grouped[e.day_of_week].push(e);
      }
      if (e.recurrence === 'none' && e.event_date === todayDate) {
        if (!grouped[e.day_of_week]) grouped[e.day_of_week] = [];
        grouped[e.day_of_week].push(e);
      }
    });
    Object.values(grouped).forEach(day => day.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return grouped;
  }, [events]);

  const tableEvents = useMemo(() => {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    return events.filter(e =>
      (e.recurrence === 'weekly' || !e.recurrence) ||
      (e.recurrence === 'none' && e.event_date === todayDate)
    );
  }, [events]);

  const saveEventColor = (eventId: string, color: string) => {
    const newMap = { ...colorMap, [eventId]: color };
    setColorMap(newMap);
    localStorage.setItem(`schedule_colors_${user.uid}`, JSON.stringify(newMap));
  };

  const getEventColor = (event: Event): string => colorMap[event.id] || colorOptions[0];

  const handleCreateEvent = (day: number, time: string | number) => {
    const formattedTime = typeof time === 'string' ? time : `${time.toString().padStart(2, '0')}:00`;
    setSelectedSlot({ day, time: formattedTime });
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setModalOpen(true);
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!confirm(`Удалить "${event.title}"?`)) return;
    try {
      await supabase.from('events').delete().eq('id', event.id);
      setEvents(prev => prev.filter(e => e.id !== event.id));
      if (currentEvent?.id === event.id) { setCurrentEvent(null); setTimeRemaining(''); setTimerFinished(false); }
      if (alarmRinging?.id === event.id) stopAlarm();
    } catch (err) { console.error('Error deleting event:', err); }
  };

  const formatTime = (time: string) => { if (!time || typeof time !== 'string') return '--:--'; return time.substring(0, 5); };

  const getDuration = (start: string, end: string): number => {
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let endM = eh * 60 + em;
    let startM = sh * 60 + sm;
    if (endM <= startM) endM += 24 * 60;
    return endM - startM;
  };

  const todayIndex = (new Date().getDay() + 6) % 7;

  const isNow = (event: Event): boolean => {
    if (!event?.start_time || !event?.end_time) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = event.start_time.split(':').map(Number);
    const [eh, em] = event.end_time.split(':').map(Number);
    let start = sh * 60 + sm;
    let end = eh * 60 + em;
    if (end <= start) end += 24 * 60;
    let checkCur = cur;
    if (checkCur < start) checkCur += 24 * 60;
    return checkCur >= start && checkCur < end;
  };

  const getNextEventToday = (): Event | null => {
    const cur = new Date().getHours() * 60 + new Date().getMinutes();
    const todayEvents = eventsByDay[todayIndex] || [];
    return todayEvents.find(e => { if (!e?.start_time) return false; const [sh] = e.start_time.split(':').map(Number); return sh * 60 > cur; }) || null;
  };

  // ===== ALARM (plays INFINITELY until stopped) =====
  const playAlarmSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Функция для проигрывания одного цикла бипов
      const playBeepCycle = () => {
        if (!audioContextRef.current) return;
        const now = ctx.currentTime;
        for (let i = 0; i < 5; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = i % 2 === 0 ? 880 : 1100;
          osc.type = 'square';
          gain.gain.setValueAtTime(0.2, now + i * 0.25);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.25 + 0.2);
          osc.start(now + i * 0.25); osc.stop(now + i * 0.25 + 0.2);
        }
      };

      // Играем сразу первый цикл
      playBeepCycle();

      // Повторяем каждые 1.5 секунды БЕСКОНЕЧНО
      alarmIntervalRef.current = setInterval(() => {
        if (audioContextRef.current) {
          if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
          playBeepCycle();
        }
      }, 1500);
    } catch (e) { console.error('Alarm error:', e); }
  };

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    // Закрываем audio context чтобы точно остановить звук
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAlarmRinging(null);
    setAlarmMessage('');
  };

  // ===== TIMER CHECK =====
  const checkCurrentEvent = () => {
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7;
    const cur = now.getHours() * 60 + now.getMinutes();

    if (currentDay !== todayIndex) { setCurrentEvent(null); setTimeRemaining(''); return; }

    const todayEvents = eventsByDay[todayIndex] || [];
    const activeEvent = todayEvents.find(e => {
      if (!e?.start_time || !e?.end_time) return false;
      const [sh, sm] = e.start_time.split(':').map(Number);
      const [eh, em] = e.end_time.split(':').map(Number);
      let start = sh * 60 + sm;
      let end = eh * 60 + em;
      if (end <= start) end += 24 * 60;
      let checkCur = cur;
      if (checkCur < start) checkCur += 24 * 60;
      return checkCur >= start && checkCur < end;
    });

    if (activeEvent && activeEvent.end_time) {
      const [eh, em] = activeEvent.end_time.split(':').map(Number);
      let endM = eh * 60 + em;
      if (endM <= cur) endM += 24 * 60;
      const remaining = endM - cur;

      if (remaining <= 0 && currentEvent?.id !== activeEvent.id && timerEnabled) {
        setAlarmRinging(activeEvent);
        setAlarmMessage(`Занятие закончилось: ${activeEvent.title}`);
        playAlarmSound();
        setTimerFinished(true);
      }

      setCurrentEvent(activeEvent);
      const h = Math.floor(remaining / 60);
      const m = remaining % 60;
      setTimeRemaining(h > 0 ? `${h}ч ${m}м` : `${m}м`);
    } else {
      setCurrentEvent(null); setTimeRemaining('');
    }

    // Check upcoming notifications
    checkUpcomingAndNotify();
  };

  useEffect(() => {
    if (events.length > 0) {
      checkCurrentEvent();
      timerIntervalRef.current = setInterval(checkCurrentEvent, 15000);
      return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
    }
  }, [events, eventsByDay, timerEnabled]);

  // Alarm event save handler
  const handleAlarmSave = async (alarmData: { time: string; enabled: boolean }) => {
    if (!editAlarmEvent) return;
    try {
      await supabase.from('events').update({
        alarm_time: alarmData.time || null,
        alarm_enabled: alarmData.enabled,
      }).eq('id', editAlarmEvent.id);

      setEvents(prev => prev.map(e =>
        e.id === editAlarmEvent.id ? { ...e, alarm_time: alarmData.time, alarm_enabled: alarmData.enabled } : e
      ));
      setEditAlarmEvent(null);
    } catch (err) { console.error('Alarm save error:', err); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-cyan-400 text-xl animate-pulse">Загрузка расписания...</div></div>;
  }

  return (
    <div className="space-y-4">
      {/* ALARM OVERLAY */}
      {alarmRinging && (
        <div className="fixed inset-0 z-[99999] bg-red-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border-4 border-red-500 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-pulse">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">
              {alarmMessage || 'БУДИЛЬНИК!'}
            </h2>
            <p className="text-xl text-white font-bold mb-1">{alarmRinging.title}</p>
            <p className="text-gray-400 mb-6">{formatTime(alarmRinging.start_time)} — {formatTime(alarmRinging.end_time)}</p>
            <button onClick={stopAlarm}
              className="w-full py-4 px-8 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-xl font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all">
              ✋ Выключить
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
          <h2 className="text-xl md:text-3xl font-bold text-white">Расписание</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTimerEnabled(!timerEnabled)}
            className={`px-3 py-2 border rounded-lg text-sm transition-colors ${timerEnabled ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
            {timerEnabled ? <Bell className="w-4 h-4 inline mr-1" /> : <BellOff className="w-4 h-4 inline mr-1" />}
            Таймер
          </button>
          <button onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white hover:border-cyan-500 transition-colors">
            {viewMode === 'cards' ? '📅 Таблица' : '📱 Карточки'}
          </button>
        </div>
      </div>

      {/* Timer Bar */}
      {timerEnabled && currentEvent && (
        <div className={`bg-gradient-to-r ${getEventColor(currentEvent)} border rounded-lg p-4 shadow-lg ${timerFinished ? 'animate-pulse' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '3s' }} />
              <div>
                <div className="text-white/80 text-xs">⏰ Сейчас идёт</div>
                <div className="text-white font-bold text-lg">{currentEvent.title}</div>
                <div className="text-white/60 text-xs">{formatTime(currentEvent.start_time)} — {formatTime(currentEvent.end_time)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-xs">Осталось</div>
              <div className="text-white font-bold text-3xl font-mono">{timeRemaining}</div>
            </div>
          </div>
        </div>
      )}
      {timerEnabled && !currentEvent && (
        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 text-center">
          <div className="text-gray-400 text-sm">⏸️ Сейчас нет занятий. Таймер запустится автоматически.</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-lg p-3">
          <div className="text-cyan-400 text-sm">Сегодня</div>
          <div className="text-white font-bold">{dayNamesFull[todayIndex]}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-3">
          <div className="text-purple-400 text-sm">Событий сегодня</div>
          <div className="text-white font-bold">{(eventsByDay[todayIndex] || []).length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-3">
          <div className="text-green-400 text-sm">Всего</div>
          <div className="text-white font-bold">{events.length}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-lg p-3">
          <div className="text-orange-400 text-sm">Следующее</div>
          <div className="text-white font-bold text-sm truncate">{getNextEventToday() ? formatTime(getNextEventToday()!.start_time) : '—'}</div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-gray-900 border border-cyan-500/30 rounded-lg overflow-hidden">
          {/* Scrollable body with STICKY HEADER */}
          <div className="overflow-auto" style={{ maxHeight: '75vh' }}>
            <div className="min-w-[1000px]">
              {/* Sticky header row - stays at top when scrolling */}
              <div className="sticky top-0 z-20 grid grid-cols-8 border-b-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10">
                <div className="bg-gray-800 p-3 border-r border-gray-700 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                {dayNames.map((day, idx) => (
                  <div key={idx} className={`p-3 text-center font-bold border-r border-gray-700 last:border-r-0 ${idx === todayIndex ? 'bg-cyan-900/60 text-cyan-300' : 'bg-gray-800 text-white'}`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Scrollable time slots */}
              {hours.map((hour) => {
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                const isNight = hour < 6 || hour >= 22;

                return (
                  <div key={hour} className={`grid grid-cols-8 border-b border-gray-700/50 last:border-b-0 ${isNight ? 'bg-indigo-900/10' : ''}`}>
                    <div className="bg-gray-800/50 p-2 border-r border-gray-700 text-center text-gray-400 text-xs font-mono sticky left-0 z-10 flex items-center justify-center">
                      {timeStr}
                    </div>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const startEvents = tableEvents.filter(e => {
                        if (e.day_of_week !== day || !e.start_time || typeof e.start_time !== 'string') return false;
                        const [eSh] = e.start_time.split(':').map(Number);
                        return eSh === hour;
                      });

                      return (
                        <div key={day} className="relative border-r border-gray-700/30 last:border-r-0" style={{ minHeight: '40px' }}>
                          {startEvents.length > 0 ? (
                            <div className="p-0.5 space-y-0.5">
                              {startEvents.map((event) => {
                                const eventIsNow = isNow(event);
                                return (
                                  <div key={event.id}
                                    onClick={() => handleEditEvent(event)}
                                    className={`bg-gradient-to-r ${getEventColor(event)} rounded px-1.5 py-1 cursor-pointer hover:opacity-80 transition-opacity ${eventIsNow ? 'ring-1 ring-white' : ''}`}>
                                    <div className="text-white text-[10px] font-bold truncate">{event.title}</div>
                                    <div className="text-white/60 text-[8px]">{formatTime(event.start_time)}-{formatTime(event.end_time)}</div>
                                    {event.alarm_enabled && event.alarm_time && <div className="text-yellow-300 text-[8px]">⏰{event.alarm_time}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div onClick={() => handleCreateEvent(day, hour)}
                              className="h-full min-h-[40px] hover:bg-cyan-500/10 cursor-pointer transition-colors flex items-center justify-center">
                              <div className="opacity-0 hover:opacity-100 transition-opacity text-cyan-400 text-base">+</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {dayNames.map((day, dayIdx) => {
            const dayEvents = eventsByDay[dayIdx] || [];
            const isToday = dayIdx === todayIndex;
            return (
              <div key={dayIdx} className={`rounded-lg border overflow-hidden ${isToday ? 'border-cyan-500/50 bg-cyan-900/10' : 'border-gray-700 bg-gray-900/50'}`}>
                <div className={`p-3 font-bold flex items-center justify-between ${isToday ? 'text-cyan-400 bg-cyan-900/20' : 'text-white bg-gray-800'}`}>
                  <div className="flex items-center gap-2">
                    {isToday && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                    <span>{dayNamesFull[dayIdx]}</span>
                  </div>
                  <span className="text-sm text-gray-400">{dayEvents.length} событий</span>
                </div>
                {dayEvents.length === 0 ? (
                  <div onClick={() => handleCreateEvent(dayIdx, 9)} className="p-4 text-center text-gray-500 hover:text-cyan-400 cursor-pointer transition-colors">
                    <Plus className="w-5 h-5 mx-auto mb-1" /><span className="text-sm">Добавить событие</span>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700/50">
                    {dayEvents.map(event => {
                      const dur = getDuration(event.start_time, event.end_time);
                      const now = isNow(event);
                      const hasAlarm = event.alarm_enabled && event.alarm_time;
                      return (
                        <div key={event.id} className={`p-4 transition-all hover:bg-gray-800/50 ${now ? 'bg-cyan-900/20 border-l-4 border-cyan-400' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEditEvent(event)}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${getEventColor(event)}`} />
                                <h3 className="font-semibold text-white truncate">{event.title}</h3>
                                {event.recurrence === 'none' && <span className="px-1.5 py-0.5 bg-yellow-600/30 text-yellow-400 text-[10px] rounded">1 раз</span>}
                                {now && <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs rounded-full animate-pulse">Сейчас</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(event.start_time)} — {formatTime(event.end_time)}</span>
                                <span className="text-gray-500">({dur} мин)</span>
                              </div>
                              {hasAlarm && (
                                <div className="flex items-center gap-1 mt-1 text-yellow-400 text-xs">
                                  <AlarmClock className="w-3 h-3" /><span>Будильник: {event.alarm_time}</span>
                                </div>
                              )}
                              {event.notes && <p className="text-gray-500 text-xs mt-1 truncate">{event.notes}</p>}
                            </div>
                            <div className="flex items-center gap-1 ml-3">
                              {/* Alarm button - always visible */}
                              <button onClick={(e) => { e.stopPropagation(); setEditAlarmEvent(event); }}
                                className={`p-2 rounded-lg transition-colors ${hasAlarm ? 'text-yellow-400 bg-yellow-900/30' : 'text-gray-500 hover:text-yellow-400 hover:bg-gray-700'}`}
                                title={hasAlarm ? `Будильник: ${event.alarm_time} (нажми изменить)` : 'Добавить будильник'}>
                                <AlarmClock className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                                className="p-2 text-gray-500 hover:text-cyan-400 transition-colors" title="Редактировать">
                                <Calendar className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event); }}
                                className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Удалить">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => handleCreateEvent(todayIndex, 9)}
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:scale-110 transition-transform z-40">
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Event Modal */}
      {modalOpen && (
        <EventModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedEvent(null); setSelectedSlot(null); }}
          event={selectedEvent}
          dayOfWeek={selectedSlot?.day ?? selectedEvent?.day_of_week ?? 0}
          startTime={selectedSlot?.time ?? selectedEvent?.start_time ?? '09:00'}
          userId={user.uid}
          onSave={() => { loadEvents(); setModalOpen(false); setSelectedEvent(null); setSelectedSlot(null); }}
          color={selectedEvent ? getEventColor(selectedEvent) : colorOptions[0]}
          onColorChange={(color) => { if (selectedEvent) saveEventColor(selectedEvent.id, color); }}
          colorOptions={colorOptions}
        />
      )}

      {/* Quick Alarm Modal */}
      {editAlarmEvent && (
        <QuickAlarmModal
          event={editAlarmEvent}
          onSave={handleAlarmSave}
          onClose={() => setEditAlarmEvent(null)}
        />
      )}
    </div>
  );
};

// ===== QUICK ALARM MODAL =====
interface QuickAlarmModalProps {
  event: Event;
  onSave: (data: { time: string; enabled: boolean }) => void;
  onClose: () => void;
}

const QuickAlarmModal: React.FC<QuickAlarmModalProps> = ({ event, onSave, onClose }) => {
  const [alarmTime, setAlarmTime] = useState(event.alarm_time || '');
  const [enabled, setEnabled] = useState(event.alarm_enabled ?? true);

  const handleSave = () => {
    onSave({ time: alarmTime, enabled: alarmTime ? enabled : false });
  };

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-sm w-full bg-gray-900 border border-yellow-500/30 rounded-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <AlarmClock className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Будильник</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-gray-300 text-sm">Событие: <span className="text-white font-bold">{event.title}</span></p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Время будильника</label>
            <input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-gray-300">Включён</span>
          </div>

          {event.alarm_enabled && (
            <button onClick={() => { onSave({ time: '', enabled: false }); }}
              className="w-full py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg hover:bg-red-900/20 transition-colors">
              🗑️ Удалить будильник
            </button>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex-1 py-2 px-4 rounded-lg font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400">
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
