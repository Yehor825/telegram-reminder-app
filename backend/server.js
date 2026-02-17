const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const cron = require('node-cron');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// ─── Database ─────────────────────────────────────────────────────────────────
const db = new Database('./database.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS publications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    publisher TEXT NOT NULL,
    groups TEXT NOT NULL,
    publications_per_day INTEGER NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    publication_id INTEGER NOT NULL,
    publisher TEXT NOT NULL,
    type TEXT NOT NULL,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ SQLite connected');
console.log('✅ Tables ready');

// ─── Telegram Bot ──────────────────────────────────────────────────────────────
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  bot.sendMessage(chatId,
    `Привет, ${username}! 👋\n\nЯ помогу отслеживать сроки публикаций.\nОткрой приложение чтобы добавить публикации! 📅`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '📱 Открыть приложение', web_app: { url: FRONTEND_URL } }
        ]]
      }
    }
  );
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('✅ Telegram bot active');

// ─── API Routes ────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/publications?userId=xxx
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
    `).all(userId);

    res.json(publications || []);
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ error: 'Failed to fetch publications' });
  }
});

// POST /api/publications
app.post('/api/publications', (req, res) => {
  const { userId, publisher, groups, publicationsPerDay, endDate } = req.body;

  console.log('POST /api/publications body:', req.body);

  if (!userId || !publisher || !groups || !publicationsPerDay || !endDate) {
    return res.status(400).json({
      error: 'All fields are required',
      received: { userId, publisher, groups, publicationsPerDay, endDate }
    });
  }

  try {
    const result = db.prepare(`
      INSERT INTO publications (user_id, publisher, groups, publications_per_day, end_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, publisher, groups, publicationsPerDay, endDate);

    const newPublication = db.prepare(
      'SELECT * FROM publications WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json(newPublication);
  } catch (error) {
    console.error('Error creating publication:', error);
    res.status(500).json({ error: 'Failed to create publication' });
  }
});

// PUT /api/publications/:id?userId=xxx
app.put('/api/publications/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  const { publisher, groups, publicationsPerDay, endDate } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    db.prepare(`
      UPDATE publications
      SET publisher = ?, groups = ?, publications_per_day = ?, end_date = ?
      WHERE id = ? AND user_id = ?
    `).run(publisher, groups, publicationsPerDay, endDate, id, userId);

    const updated = db.prepare('SELECT * FROM publications WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating publication:', error);
    res.status(500).json({ error: 'Failed to update publication' });
  }
});

// DELETE /api/publications/:id?userId=xxx
app.delete('/api/publications/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    db.prepare('DELETE FROM publications WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    res.status(500).json({ error: 'Failed to delete publication' });
  }
});

// GET /api/notifications?userId=xxx
app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY sent_at DESC
      LIMIT 50
    `).all(userId);

    res.json(notifications || []);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ─── Scheduler ─────────────────────────────────────────────────────────────────
function checkAndSendReminders() {
  console.log('Checking for reminders...');

  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Публикации которые заканчиваются сегодня
    const todayPubs = db.prepare(`
      SELECT * FROM publications WHERE end_date = ?
    `).all(today);

    // Публикации которые заканчиваются завтра
    const tomorrowPubs = db.prepare(`
      SELECT * FROM publications WHERE end_date = ?
    `).all(tomorrow);

    todayPubs.forEach(pub => {
      bot.sendMessage(pub.user_id,
        `🔴 Сегодня заканчивается публикация!\n\n👤 ${pub.publisher}\n📢 ${pub.groups}`
      ).catch(err => console.error('Bot send error:', err.message));

      db.prepare(`
        INSERT INTO notifications (user_id, publication_id, publisher, type)
        VALUES (?, ?, ?, 'today')
      `).run(pub.user_id, pub.id, pub.publisher);
    });

    tomorrowPubs.forEach(pub => {
      bot.sendMessage(pub.user_id,
        `🟡 Завтра заканчивается публикация!\n\n👤 ${pub.publisher}\n📢 ${pub.groups}`
      ).catch(err => console.error('Bot send error:', err.message));

      db.prepare(`
        INSERT INTO notifications (user_id, publication_id, publisher, type)
        VALUES (?, ?, ?, 'tomorrow')
      `).run(pub.user_id, pub.id, pub.publisher);
    });

  } catch (error) {
    console.error('Error in reminder check:', error);
  }
}

// Каждый день в 9:00
cron.schedule('0 9 * * *', checkAndSendReminders);

console.log('✅ Scheduler active');

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`✅ Telegram bot is active`);
  console.log(`✅ Reminder scheduler is active`);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
