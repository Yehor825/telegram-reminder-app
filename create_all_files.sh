#!/bin/bash

# Root files
cat > README.md << 'EOF'
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
EOF

cat > .gitignore << 'EOF'
node_modules/
.env
*.sqlite
*.db
dist/
build/
.vercel
*.log
.DS_Store
EOF

# Backend files
cd backend

cat > package.json << 'EOF'
{
  "name": "telegram-reminder-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-telegram-bot-api": "^0.64.0",
    "sqlite3": "^5.1.7",
    "dotenv": "^16.3.1",
    "node-cron": "^3.0.3",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  }
}
EOF

cat > .env.example << 'EOF'
BOT_TOKEN=your_bot_token_here
PORT=3000
FRONTEND_URL=https://your-app.vercel.app
DB_PATH=./database.sqlite
EOF

# Created server.js, database.js, notificationService.js already

cd ../frontend

cat > package.json << 'EOF'
{
  "name": "telegram-reminder-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.8"
  }
}
EOF

cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
EOF

cat > tailwind.config.js << 'EOF'
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: []
}
EOF

cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
EOF

cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Напоминания о публикациях</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOF

cd src

cat > config.js << 'EOF'
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
EOF

cat > main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
EOF

cat > index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  background-color: var(--tg-theme-bg-color, #f9fafb);
  color: var(--tg-theme-text-color, #000);
}
EOF

echo "✅ All files created!"
