const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
    this.db = null;
  }

  init() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        return;
      }
      console.log('✅ Connected to SQLite database');
      this.createTables();
    });
  }

  createTables() {
    // Таблица пользователей
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        chat_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица публикаций
    this.db.run(`
      CREATE TABLE IF NOT EXISTS publications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        publisher TEXT NOT NULL,
        groups TEXT NOT NULL,
        publications_per_day INTEGER NOT NULL,
        end_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(telegram_id)
      )
    `);

    // Таблица уведомлений
    this.db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        publication_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (publication_id) REFERENCES publications(id),
        FOREIGN KEY (user_id) REFERENCES users(telegram_id)
      )
    `);

    console.log('✅ Database tables initialized');
  }

  // Пользователи
  createUser(telegramId, username, chatId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO users (telegram_id, username, chat_id) VALUES (?, ?, ?)',
        [telegramId, username, chatId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  getUser(telegramId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE telegram_id = ?',
        [telegramId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // Публикации
  createPublication(data) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO publications (user_id, publisher, groups, publications_per_day, end_date) 
         VALUES (?, ?, ?, ?, ?)`,
        [data.userId, data.publisher, data.groups, data.publicationsPerDay, data.endDate],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  getPublications(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM publications WHERE user_id = ? AND is_active = 1 ORDER BY end_date ASC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  updatePublication(id, userId, data) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE publications 
         SET publisher = ?, groups = ?, publications_per_day = ?, end_date = ?
         WHERE id = ? AND user_id = ?`,
        [data.publisher, data.groups, data.publicationsPerDay, data.endDate, id, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  deletePublication(id, userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE publications SET is_active = 0 WHERE id = ? AND user_id = ?',
        [id, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  // Получить публикации для напоминаний
  getPublicationsForReminders() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT p.*, u.chat_id 
         FROM publications p
         JOIN users u ON p.user_id = u.telegram_id
         WHERE p.is_active = 1 AND p.end_date >= date('now')`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Уведомления
  createNotification(publicationId, userId, type) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO notifications (publication_id, user_id, type) VALUES (?, ?, ?)',
        [publicationId, userId, type],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getNotifications(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT n.*, p.publisher, p.groups, p.end_date
         FROM notifications n
         JOIN publications p ON n.publication_id = p.id
         WHERE n.user_id = ?
         ORDER BY n.sent_at DESC
         LIMIT 50`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Проверка, было ли отправлено уведомление
  notificationExists(publicationId, type) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM notifications WHERE publication_id = ? AND type = ?',
        [publicationId, type],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = Database;
