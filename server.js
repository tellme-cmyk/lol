const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');

// Берем токен из переменных окружения Railway. На платформе нужно будет создать переменную BOT_TOKEN
const BOT_TOKEN = process.env.BOT_TOKEN; 

if (!BOT_TOKEN) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: Переменная BOT_TOKEN не задана в настройках Railway!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json());

// Разрешаем фронтенду делать запросы к бэкенду (CORS-политика)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Раздаем файл index.html прямо с этого же сервера
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// 1. ЛОГИКА ДЛЯ ТЕЛЕГРАМ БОТА
// ==========================================

// При старте бота выдаем кнопку, которая открывает наш сайт на Railway
bot.start((ctx) => {
  // Railway автоматически выдает домен, если вы создали его в настройках (Generate Domain)
  // Мы можем использовать его или вы можете заменить MINI_APP_URL на ссылку от Vercel
  const appUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
    : 'УКАЖИТЕ_СВОЮ_ССЫЛКУ_ЕСЛИ_ЭКРАН_ОТДЕЛЬНО';

  ctx.reply('Привет! Готов испытать удачу в кейсе "Теллс"? 🎁', {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎰 Открыть кейс Теллс", web_app: { url: appUrl } }]
      ]
    }
  });
});

// Проверка перед списанием Звёзд (Телеграм запрашивает одобрение транзакции)
bot.on('pre_checkout_query', async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

// Успешная оплата
bot.on('successful_payment', (ctx) => {
  console.log(`🎉 Пользователь ${ctx.from.id} успешно открыл кейс за Звёзды!`);
});

// ==========================================
// 2. API ЭНДПОИНТ ДЛЯ МИНИ-ПРИЛОЖЕНИЯ
// ==========================================

app.post('/create-invoice', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    // Генерируем ссылку на оплату 99 Telegram Stars (код XTR)
    const invoiceLink = await bot.telegram.createInvoiceLink({
      title: "Кейс Теллс",
      description: "Оплата 99 Звёзд за открытие кейса с NFT-подарком Telegram",
      payload: `tells_case_${userId}_${Date.now()}`,
      provider_token: "", // Для Stars оставляем пустым!
      currency: "XTR",     // Международный код Telegram Stars
      prices: [{ label: "Кейс Теллс", amount: 99 }]
    });

    res.json({ invoiceLink });

  } catch (error) {
    console.error('Ошибка создания инвойса:', error);
    res.status(500).json({ error: 'Не удалось создать счёт для оплаты' });
  }
});

// Запуск сервера на порту, который автоматически выдаст Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Сервер запущен на порту ${PORT}`);
});

bot.launch().then(() => console.log('🤖 Бот успешно запущен!'));

// Безопасное выключение
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
