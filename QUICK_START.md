# ⚡ Быстрый старт

## 📦 Что внутри

Готовый к деплою Telegram Mini App:
- ✅ Frontend (React + Vite + Tailwind)
- ✅ Backend (Node.js + Express + SQLite)
- ✅ Telegram Bot с автоматическими напоминаниями
- ✅ Полная документация

## 🚀 Деплой за 5 минут

### 1. Создайте Telegram бота
- Откройте [@BotFather](https://t.me/BotFather)
- Отправьте `/newbot`
- Получите токен (сохраните!)

### 2. Загрузите на GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### 3. Деплой Backend → Railway
1. https://railway.app → Deploy from GitHub
2. Выберите репозиторий
3. Root: `backend`
4. Добавьте переменную: `BOT_TOKEN=ваш_токен`
5. Скопируйте URL Railway

### 4. Деплой Frontend → Vercel
1. https://vercel.com → Import Git
2. Root: `frontend`
3. Добавьте: `VITE_API_URL=https://railway-url/api`
4. Deploy!

### 5. Настройте Mini App
1. @BotFather → /mybots → ваш бот
2. Bot Settings → Menu Button → URL Vercel
3. /newapp → URL Vercel

### 6. Обновите Backend
В Railway добавьте: `FRONTEND_URL=https://vercel-url`

## ✅ Готово!

Откройте бота → /start → Открыть приложение

## 📖 Полная документация

- `README.md` - обзор проекта
- `GITHUB_SETUP.md` - детальная инструкция
- `backend/.env.example` - пример конфигурации
