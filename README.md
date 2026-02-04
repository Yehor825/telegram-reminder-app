# 📱 Telegram Mini App - Напоминания о публикациях

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

## 🚀 Быстрый деплой

### 1. Backend на Railway
1. Fork репозиторий
2. Зайдите на Railway.app
3. New Project → Deploy from GitHub
4. Выберите этот репозиторий
5. Root Directory: `backend`
6. Добавьте переменные окружения:
   - `BOT_TOKEN` - от @BotFather
   - `FRONTEND_URL` - будет URL Vercel
   - `PORT` - 3000

### 2. Frontend на Vercel
1. Зайдите на Vercel.com
2. Import Git Repository
3. Root Directory: `frontend`
4. Framework Preset: Vite
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variables:
   - `VITE_API_URL` - URL Railway backend

### 3. Настройка бота
1. @BotFather → /mybots → ваш бот
2. Bot Settings → Menu Button → URL Vercel
3. /newapp → создайте Mini App

## 💻 Локальный запуск

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## 📋 Возможности
- ✅ Личный кабинет
- ✅ Напоминания за 1 день и в день окончания
- ✅ История уведомлений
- ✅ Адаптивный дизайн

## 📝 Лицензия
MIT
