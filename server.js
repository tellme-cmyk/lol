const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN; 

if (!BOT_TOKEN) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: Переменная BOT_TOKEN не задана!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json());

// Разрешаем CORS-запросы
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// === МАГИЧЕСКИЙ ПЕРЕВОДЧИК РЕГИСТРА ФАЙЛОВ ===
// Этот код находит файлы на сервере, даже если в коде маленькие буквы, а на диске большие
app.use((req, res, next) => {
  // Проверяем, что запрос идет к файлу (например, картинке .webp), а не к API
  if (req.path.includes('.')) {
    const requestedFile = path.join(__dirname, req.path);
    
    // Если файл в оригинальном виде не найден
    if (!fs.existsSync(requestedFile)) {
      const dir = path.dirname(requestedFile);
      const filename = path.basename(requestedFile).toLowerCase();
      
      try {
        const files = fs.readdirSync(dir);
        // Ищем файл в папке, не обращая внимания на большие/маленькие буквы
        const found = files.find(f => f.toLowerCase() === filename);
        
        if (found) {
          // Если нашли файл с большими буквами, подменяем адрес запроса
          req.url = path.join(path.dirname(req.url), found);
        }
      } catch (err) {
        console.error("Ошибка поиска файла:", err);
      }
    }
  }
  next();
});

// Разрешаем раздачу всех картинок и файлов из папки
app.use(express.static(__dirname));

// Отдаем главный экран приложения
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Логика запуска бота
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

// Создание ссылки на оплату Звёзд
app.post('/create-invoice', async (req, res) => {
  try {
    const { userId } = req.body;
    const invoiceLink = await bot.telegram.createInvoiceLink({
      title: "Кейс Теллс",
      description: "Оплата 99 Звёзд за открытие кейса с NFT-подарком Telegram",
      payload: `tells_${userId || 0}_${Date.now()}`,
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
  console.log(`🌐 Сервер TeleLoot запущен на порту ${PORT}`);
});

bot.launch();
