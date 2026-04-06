// Supabase Edge Function для Telegram бота
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

serve(async (req) => {
  const body = await req.json()
  
  // Handle /start command
  if (body.message?.text?.startsWith('/start')) {
    const chatId = body.message.chat.id.toString()
    const username = body.message.from.username || ''
    
    // Save to database
    await supabase
      .from('telegram_users')
      .upsert({
        telegram_id: chatId,
        username: username,
      }, { onConflict: 'telegram_id' })
    
    // Send welcome message
    await sendTelegramMessage(chatId,
`👋 Привет! Я бот расписания KBTU!

✅ Ты подписан на уведомления!

Буду присылать:
⏰ За 5 минут до начала
🔴 Когда занятие началось
✅ Когда занятие закончилось

Чтобы отписаться: /stop`
    )
    
    return new Response('OK', { status: 200 })
  }
  
  // Handle /stop command
  if (body.message?.text === '/stop') {
    const chatId = body.message.chat.id.toString()
    
    await supabase
      .from('telegram_users')
      .delete()
      .eq('telegram_id', chatId)
    
    await sendTelegramMessage(chatId, '❌ Ты отписался от уведомлений.\nЧтобы подписаться: /start')
    
    return new Response('OK', { status: 200 })
  }
  
  // Handle /help command
  if (body.message?.text === '/help') {
    const chatId = body.message.chat.id.toString()
    
    await sendTelegramMessage(chatId,
`📚 Команды бота KBTU:

/start — Подписаться на уведомления
/stop — Отписаться
/help — Эта справка

Уведомления приходят:
⏰ За 5 мин до начала
🔴 В начале занятия
✅ В конце занятия`
    )
    
    return new Response('OK', { status: 200 })
  }
  
  return new Response('OK', { status: 200 })
})

async function sendTelegramMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  })
}
