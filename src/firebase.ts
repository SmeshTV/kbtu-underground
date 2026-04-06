import { initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDQ8RKHWF2hV9er5wce46n90XQL8HVYvYY",
  authDomain: "university-underground.firebaseapp.com",
  projectId: "university-underground",
  storageBucket: "university-underground.firebasestorage.app",
  messagingSenderId: "1064101506987",
  appId: "1:1064101506987:web:aadb3225521da65a87acee",
  measurementId: "G-R35L7WYWEP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Firebase Messaging
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export { sendPasswordResetEmail, GoogleAuthProvider };

// VAPID ключ для Web Push
export const VAPID_KEY = "BKcpg8bG15pBYzrl8TeJRHBRAYQAsTc5G2uALGTGAmjsK-hC65OKjxXrvjk7z46AWbIkk6UJuxEB_aVANEg3yHs";

// Запрос разрешения и получение токена
export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');
      // Сохраняем токен в Supabase
      const { supabase } = await import('./supabase');
      
      // Проверяем есть ли уже такой токен
      const { data: existing } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('token', token)
        .single();

      if (!existing) {
        await supabase.from('push_tokens').insert({
          user_id: userId,
          token,
          platform: 'web',
        });
      }
      
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Слушаем сообщения когда приложение открыто
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};