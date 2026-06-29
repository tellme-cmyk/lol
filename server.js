const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');

// 1. НАСТРОЙКА ТОКЕНА И БОТА
// Берем токен из переменных окружения Railway (вкладка Variables -> BOT_TOKEN)
const BOT_TOKEN = process.env.BOT_TOKEN; 

if (!BOT_TOKEN) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: Переменная BOT_TOKEN не задана в настройках Railway!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json());

// 2. CORS-ПОЛИТИКА (Разрешаем запросы от Мини Апп к серверу)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 3. РАЗДАЧА ИНТЕРФЕЙСА (Отдаем index.html при переходе по ссылке домена)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// 4. ЛОГИКА ДЛЯ ТЕЛЕГРАМ БОТА (TeleLoot)
// ==========================================

// Команда /start выдает кнопку открытия приложения
bot.start((ctx) => {
  // Railway сам подставит домен в переменную RAILWAY_PUBLIC_DOMAIN, если он включен в Settings
  const appUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
    : 'https://railway.app'; // Можете вписать сюда ваш домен руками, если переменная не сработает

  ctx.reply('Привет! Готов испытать удачу в кейсе "Теллс"? 🎁', {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎰 Открыть кейс Теллс", web_app: { url: appUrl } }]
      ]
    }
  });
});

// Обязательное одобрение транзакции перед списанием Звёзд Телеграм
bot.on('pre_checkout_query', async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

// Уведомление в консоль при успешной оплате от пользователя
bot.on('successful_payment', (ctx) => {
  const paymentInfo = ctx.message.successful_payment;
  console.log(`🎉 Пользователь ${ctx.from.id} успешно оплатил ${paymentInfo.total_amount} Звёзд!`);
});

// ==========================================
// 5. API ЭНДПОИНТ ДЛЯ ОПЛАТЫ КЕЙСА
// ==========================================

app.post('/create-invoice', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Не указан ID пользователя' });
    }

    // Создаем счет на оплату 99 Звёзд Telegram (международный код валюты — XTR)
    const invoiceLink = await bot.telegram.createInvoiceLink({
      title: "Кейс Теллс",
      description: "Оплата 99 Звёзд за открытие кейса с NFT-подарком Telegram",
      payload: `tells_case_${userId}_${Date.now()}`,
      provider_token: "", // Для Telegram Stars оставляем строго ПУСТЫМ!
      currency: "XTR",     // Код Звёзд
      prices: [{ label: "Кейс Теллс", amount: 99 }]
    });

    // Отдаем ссылку на оплату обратно в Mini App
    res.json({ invoiceLink });

  } catch (error) {
    console.error('Ошибка создания инвойса:', error);
    res.status(500).json({ error: 'Не удалось создать счёт для оплаты' });
  }
});

// ==========================================
// 6. ЗАПУСК СЕРВЕРА С ПРАВИЛЬНЫМИ НАСТРОЙКАМИ ДЛЯ СЕТИ
// ==========================================

const PORT = process.env.PORT || 3000;

// Указываем '0.0.0.0', чтобы Railway смог пропустить внешний интернет-трафик к коду
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Сервер TeleLoot успешно запущен на порту ${PORT} и хосте 0.0.0.0`);
});

// Включаем чтение сообщений бота
bot.launch().then(() => console.log('🤖 Бот TeleLoot успешно запущен!'));

// Корректная остановка сервера при обновлениях в Railway
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
