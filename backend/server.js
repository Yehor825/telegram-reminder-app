require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const Database = require('./database');
const NotificationService = require('./notificationService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(bodyParser.json());

// Инициализация бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Инициализация базы данных
const db = new Database();
db.init();

// Инициализация сервиса уведомлений
const notificationService = new NotificationService(bot, db);

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  // Сохраняем пользователя в БД
  db.createUser(userId, username, chatId);

  bot.sendMessage(chatId, `Привет, ${username}! 👋\n\nЯ помогу тебе отслеживать сроки публикаций объявлений.\n\nОткрой приложение, чтобы добавить свои публикации, и я буду напоминать тебе о них за день до окончания и в день окончания! 📅`, {
    reply_markup: {
      inline_keyboard: [[
        { text: '📱 Открыть приложение', web_app: { url: process.env.FRONTEND_URL || 'http://localhost:5173' } }
      ]]
    }
  });
});

// API Routes

// Получить все публикации пользователя
// Get all publications for a user
app.get('/api/publications', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const publications = db.prepare(`
      SELECT * FROM publications 
      WHERE user_id = ? 
      ORDER BY end_date ASC
    `).all(userId);  // ← ВАЖНО: .all() возвращает массив!
    
    res.json(publications || []);  // ← ВАЖНО: всегда массив!
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ error: 'Failed to fetch publications' });
  }
});

// Добавить новую публикацию
app.post('/api/publications', (req, res) => {
  const { userId, publisher, groups, publicationsPerDay, endDate } = req.body;

  if (!userId || !publisher || !groups || !publicationsPerDay || !endDate) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const publicationId = db.createPublication({
    userId,
    publisher,
    groups,
    publicationsPerDay,
    endDate
  });

  res.json({ id: publicationId, message: 'Publication created successfully' });
});

// Обновить публикацию
app.put('/api/publications/:id', (req, res) => {
  const { id } = req.params;
  const { publisher, groups, publicationsPerDay, endDate } = req.body;
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const success = db.updatePublication(id, userId, {
    publisher,
    groups,
    publicationsPerDay,
    endDate
  });

  if (success) {
    res.json({ message: 'Publication updated successfully' });
  } else {
    res.status(404).json({ error: 'Publication not found' });
  }
});

// Удалить публикацию
app.delete('/api/publications/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const success = db.deletePublication(id, userId);

  if (success) {
    res.json({ message: 'Publication deleted successfully' });
  } else {
    res.status(404).json({ error: 'Publication not found' });
  }
});

// Получить историю уведомлений
app.get('/api/notifications', (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const notifications = db.getNotifications(userId);
  res.json(notifications);
});

// Планировщик для проверки и отправки напоминаний
// Проверка каждый час
cron.schedule('0 * * * *', () => {
  console.log('Checking for reminders...');
  notificationService.checkAndSendReminders();
});

// Дополнительная проверка в 9:00 каждый день
cron.schedule('0 9 * * *', () => {
  console.log('Daily reminder check at 9:00 AM...');
  notificationService.checkAndSendReminders();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`✅ Telegram bot is active`);
  console.log(`✅ Reminder scheduler is active`);
});

// Обработка ошибок
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});
