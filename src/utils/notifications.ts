import { Event } from '../supabase';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const scheduleEventNotification = (event: Event) => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const [eventHour, eventMinute] = event.start_time.split(':').map(Number);

  let daysUntilEvent = event.day_of_week - currentDay;
  if (daysUntilEvent < 0) {
    daysUntilEvent += 7;
  }

  const eventDate = new Date(now);
  eventDate.setDate(eventDate.getDate() + daysUntilEvent);
  eventDate.setHours(eventHour, eventMinute, 0, 0);

  const oneHourBefore = new Date(eventDate.getTime() - 60 * 60 * 1000);
  const timeUntilNotification = oneHourBefore.getTime() - now.getTime();

  if (timeUntilNotification > 0 && timeUntilNotification < 7 * 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('Напоминание о событии', {
          body: `${event.title} начнется через 1 час (${event.start_time})`,
          icon: '/favicon.ico',
          tag: event.id,
        });
      }
    }, timeUntilNotification);
  }
};

export const scheduleAllNotifications = (events: Event[]) => {
  events.forEach(event => {
    scheduleEventNotification(event);
  });
};

export const checkUpcomingEvents = (events: Event[]) => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  events.forEach(event => {
    if (event.day_of_week === currentDay) {
      const [eventHour, eventMinute] = event.start_time.split(':').map(Number);
      const eventTimeInMinutes = eventHour * 60 + eventMinute;
      const timeDiff = eventTimeInMinutes - currentTimeInMinutes;

      if (timeDiff === 60) {
        if (Notification.permission === 'granted') {
          new Notification('Напоминание о событии', {
            body: `${event.title} начнется через 1 час (${event.start_time})`,
            icon: '/favicon.ico',
            tag: event.id,
          });
        }
      }
    }
  });
};
