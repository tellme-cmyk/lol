const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN; 

if (!BOT_TOKEN) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: Переменная BOT_TOKEN не задана!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// === НОВЫЙ ДВИЖОК: СКАЧИВАНИЕ ОФИЦИАЛЬНЫХ КАРТИНОК БЕЗ БЛОКИРОВОК ===
app.get('/proxy-gift', (req, res) => {
  const giftName = req.query.name;
  if (!giftName) return res.status(400).send('No gift name');
  
  // Официальный сервер картинок Fragment
  const url = `https://fragment.com{giftName}-1.png`;

  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      return res.status(404).send('Gift not found');
    }
    res.setHeader('Content-Type', 'image/png');
    // Кешируем картинки в системе, чтобы они загружались мгновенно
    res.setHeader('Cache-Control', 'public, max-age=86400'); 
    response.pipe(res);
  }).on('error', (e) => {
    res.status(500).send(e.message);
  });
});

// === ЛОГИКА ТЕЛЕГРАМ БОТА ===
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

bot.on('pre_checkout_query', async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.on('successful_payment', (ctx) => {
  console.log(`🎉 Пользователь ${ctx.from.id} оплатил кейс.`);
});

// === API ДЛЯ ГЕНЕРАЦИИ ОПЛАТЫ В ЗВЕЗДАХ ===
app.post('/create-invoice', async (req, res) => {
  try {
    const { userId } = req.body;
    const invoiceLink = await bot.telegram.createInvoiceLink({
      title: "Кейс Теллс",
      description: "Оплата 99 Звёзд за открытие кейса с NFT-подарком Telegram",
      payload: `tells_case_${userId}_${Date.now()}`,
      provider_token: "", 
      currency: "XTR",     
      prices: [{ label: "Кейс Теллс", amount: 99 }]
    });
    res.json({ invoiceLink });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания инвойса' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Сервер запущен на порту ${PORT}`);
});

bot.launch();
