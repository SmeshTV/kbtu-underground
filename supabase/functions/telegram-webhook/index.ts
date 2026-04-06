import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'content-type',
        },
      })
    }

    const body = await req.json()
    console.log('Received:', JSON.stringify(body).substring(0, 200))
    
    if (!body.message) {
      return new Response('ok', { status: 200 })
    }

    const chatId = body.message.chat.id.toString()
    const text = body.message.text || ''
    const username = body.message.from.username || ''
    const firstName = body.message.from.first_name || ''

    console.log('Message from', chatId, ':', text)

    // Handle /start
    if (text === '/start') {
      await sendMessage(chatId,
`👋 Привет, ${firstName}! Я бот расписания KBTU!

Для привязки аккаунта:
1. Открой приложение KBTU Underground
2. Нажми "Привязать Telegram"
3. Скопируй код
4. Напиши: /connect 123456

После привязки буду присылать:
⏰ За 5 минут до начала
🔴 Когда занятие началось
✅ Когда занятие закончилось

Отписаться: /stop`
      )
      return new Response('ok', { status: 200 })
    }

    // Handle /connect CODE
    if (text.startsWith('/connect ')) {
      const code = text.replace('/connect ', '').trim()
      
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        await sendMessage(chatId, '❌ Код должен быть 6 цифр!\nПример: /connect 123456')
        return new Response('ok', { status: 200 })
      }

      // Ищем код в БД
      const codesRes = await fetch(`${SUPABASE_URL}/rest/v1/connect_codes?code=eq.${code}`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        },
      })
      const codes = await codesRes.json()

      if (!codes || codes.length === 0) {
        await sendMessage(chatId, '❌ Код не найден!\n\nУбедись что:\n1. Скопировал код из приложения\n2. Код не истёк (действует 10 минут)')
        return new Response('ok', { status: 200 })
      }

      const userId = codes[0].user_id

      // Удаляем использованный код
      await fetch(`${SUPABASE_URL}/rest/v1/connect_codes?id=eq.${codes[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        },
      })

      // Проверяем есть ли уже такой telegram_id
      const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/telegram_users?telegram_id=eq.${chatId}`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        },
      })
      const existing = await existingRes.json()

      if (existing && existing.length > 0) {
        // Обновляем
        await fetch(`${SUPABASE_URL}/rest/v1/telegram_users?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId, username: username, first_name: firstName }),
        })
      } else {
        // Создаём
        await fetch(`${SUPABASE_URL}/rest/v1/telegram_users`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ telegram_id: chatId, user_id: userId, username: username, first_name: firstName }),
        })
      }

      await sendMessage(chatId, `✅ Готово! Аккаунт привязан!\n\nТеперь буду присылать уведомления о расписании!`
      )
      return new Response('ok', { status: 200 })
    }

    // Handle /stop
    if (text === '/stop') {
      await fetch(`${SUPABASE_URL}/rest/v1/telegram_users?telegram_id=eq.${chatId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        },
      })
      await sendMessage(chatId, '❌ Отписался.\nПодписаться: /start')
      return new Response('ok', { status: 200 })
    }

    // Handle /help
    if (text === '/help') {
      await sendMessage(chatId,
`📚 Команды:
/start — Начать
/connect КОД — Привязать аккаунт
/stop — Отписаться
/help — Справка`
      )
      return new Response('ok', { status: 200 })
    }

    return new Response('ok', { status: 200 })

  } catch (error) {
    console.error('Error:', error.message)
    return new Response('ok', { status: 200 })
  }
})

async function sendMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  })
  console.log('Telegram API response:', res.status)
}
