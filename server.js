const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN; 

if (!BOT_TOKEN) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: Переменная BOT_TOKEN не задана в Railway!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json());

// CORS-политика для бесперебойной работы в Telegram
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Главная страница приложения
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// === ИСПРАВЛЕННЫЙ РОУТЕР КАРТИНОК ===
// Перенаправляет запросы к картинкам, игнорируя большие и маленькие буквы
app.get('/assets/:filename', (req, res) => {
  const requestedName = req.params.filename.toLowerCase();
  
  try {
    const files = fs.readdirSync(__dirname);
    // Ищем файл в папке проекта, переводя всё в нижний регистр
    const realFile = files.find(f => f.toLowerCase() === requestedName);
    
    if (realFile) {
      res.sendFile(path.join(__dirname, realFile));
    } else {
      res.status(404).send('File not found');
    }
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Команда запуска бота
bot.start((ctx) => {
  const appUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
    : 'https://railway.app';

  ctx.reply('Привет! Готов испытать удачу в кейсе "Теллс"? 🎁', {
    reply_markup: {
      inline_keyboard: [[{ text: "🎰 Открыть кейс Теллс", web_app: { url: appUrl } }]]
    }
  });
});

bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));

// Создание ссылки на оплату
app.post('/create-invoice', async (req, res) => {
  try {
    const { userId } = req.body;
    const invoiceLink = await bot.telegram.createInvoiceLink({
      title: "Кейс Теллс",
      description: "Оплата 99 Звёзд за открытие кейса",
      payload: `tells_${userId || 0}_${Date.now()}`,
      provider_token: "", 
      currency: "XTR", 
      prices: [{ label: "Кейс Теллс", amount: 99 }]
    });
    res.json({ invoiceLink });
  } catch (error) {
    res.status(500).json({ error: 'Invoice error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Сервер TeleLoot запущен на порту ${PORT}`);
});

bot.launch();
