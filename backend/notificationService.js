class NotificationService {
  constructor(bot, database) {
    this.bot = bot;
    this.db = database;
  }

  async checkAndSendReminders() {
    try {
      const publications = await this.db.getPublicationsForReminders();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const pub of publications) {
        const endDate = new Date(pub.end_date);
        endDate.setHours(0, 0, 0, 0);

        const daysUntilEnd = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));

        // Напоминание за 1 день до окончания
        if (daysUntilEnd === 1) {
          const exists = await this.db.notificationExists(pub.id, 'one_day_before');
          if (!exists) {
            await this.sendReminder(pub, 'one_day_before');
          }
        }

        // Напоминание в день окончания
        if (daysUntilEnd === 0) {
          const exists = await this.db.notificationExists(pub.id, 'end_day');
          if (!exists) {
            await this.sendReminder(pub, 'end_day');
          }
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async sendReminder(publication, type) {
    try {
      let message = '';
      const endDate = new Date(publication.end_date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      if (type === 'one_day_before') {
        message = `⏰ <b>Напоминание!</b>\n\n`;
        message += `Завтра, <b>${endDate}</b>, заканчивается срок публикации:\n\n`;
        message += `👤 <b>Публикатор:</b> ${publication.publisher}\n`;
        message += `📢 <b>Группы:</b> ${publication.groups}\n`;
        message += `📊 <b>Публикаций в день:</b> ${publication.publications_per_day}\n\n`;
        message += `Не забудьте продлить или завершить публикацию! 📝`;
      } else if (type === 'end_day') {
        message = `🔔 <b>Последний день!</b>\n\n`;
        message += `Сегодня, <b>${endDate}</b>, заканчивается срок публикации:\n\n`;
        message += `👤 <b>Публикатор:</b> ${publication.publisher}\n`;
        message += `📢 <b>Группы:</b> ${publication.groups}\n`;
        message += `📊 <b>Публикаций в день:</b> ${publication.publications_per_day}\n\n`;
        message += `Это последний день! Примите необходимые меры. ✅`;
      }

      await this.bot.sendMessage(publication.chat_id, message, {
        parse_mode: 'HTML'
      });

      // Сохраняем уведомление в БД
      await this.db.createNotification(publication.id, publication.user_id, type);
      
      console.log(`✅ Reminder sent: ${type} for publication ${publication.id}`);
    } catch (error) {
      console.error(`Error sending reminder for publication ${publication.id}:`, error);
    }
  }

  // Метод для тестирования (отправка тестового напоминания)
  async sendTestReminder(chatId) {
    const message = `🧪 <b>Тестовое напоминание</b>\n\n`;
    message += `Это тестовое сообщение для проверки работы системы напоминаний.\n\n`;
    message += `Если вы видите это сообщение, значит бот работает правильно! ✅`;

    try {
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Error sending test reminder:', error);
    }
  }
}

module.exports = NotificationService;
