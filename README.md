# Description Generator

Генерация продающих описаний товаров по фото с помощью ИИ.

> Загрузите фото товара — нейросеть мгновенно определит товар и напишет убедительное описание, которое поможет увеличить продажи.

## Возможности

- ✨ **AI-анализ фото** — нейросеть Qwen-VL распознаёт товар по изображению
- 🌍 **Русский язык** — описания генерируются на русском языке
- ⚡ **Быстро** — готовое описание за 10-15 секунд
- 📋 **Копирование и скачивание** — в буфер обмена или файл (.md / .txt)
- 🔐 **Авторизация** — регистрация, вход, персональная история генераций
- 🎁 **10₽ при регистрации** — бесплатный стартовый баланс
- 💳 **Оплата через ЮMoney (СБП)** — QR-код + popup (1 генерация = 10₽)
- 🛡️ **Админ-панель** — управление пользователями, балансами
- 📱 **Адаптивный дизайн** — работает на любых устройствах
- 🌙 **Тёмная тема** — переключатель светлой/тёмной темы

## Быстрый старт

### Требования

- Python 3.9+
- Node.js 18+
- API ключ от OpenRouter

### 1. Получи API ключ

1. Зайди на https://openrouter.ai/
2. Зарегистрируйся через Google/GitHub
3. Перейди в [Keys](https://openrouter.ai/keys)
4. Создай новый ключ (Create Key)

> 💡 OpenRouter даёт бесплатные кредиты при регистрации.

### 2. Запусти бэкенд

```bash
cd backend

# Создай виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Установи зависимости
pip install -r requirements.txt

# Создай .env файл с API ключом
cp .env.example .env
# Отредактируй .env, вставь свой OPENROUTER_API_KEY

# Запусти сервер
python main.py
```

Сервер запустится на **http://localhost:5000**

### 3. Запусти фронтенд

```bash
cd frontend
npm install
npm run dev
```

Открой **http://localhost:3000** в браузере.

### Docker Compose (альтернатива)

```bash
export OPENROUTER_API_KEY=sk-or-v1-твой_ключ
docker compose up --build
```

## Структура проекта

```
description/
├── backend/                    # FastAPI (Python)
│   ├── main.py                 # API сервер + интеграция с OpenRouter
│   ├── database.py             # SQLAlchemy модели (users, generations, payments)
│   ├── auth.py                 # JWT аутентификация
│   ├── requirements.txt        # Python зависимости
│   └── .env.example            # Пример .env файла
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── App.jsx             # Роутинг + Landing/MainPage
│   │   ├── AuthContext.jsx     # Контекст авторизации
│   │   ├── components/         # Подкомпоненты
│   │   │   ├── UploadZone.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── ResultDisplay.jsx
│   │   │   └── HistoryPanel.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── PricingPage.jsx
│   │       ├── PaymentSuccessPage.jsx
│   │       └── AdminPage.jsx
│   ├── index.html              # Vite entry point
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## Технологии

| Слой | Технология |
|------|------------|
| **Backend** | FastAPI, SQLAlchemy, SQLite, httpx, Pillow |
| **Auth** | JWT (python-jose), bcrypt |
| **Frontend** | React 19, Vite, React Router, react-markdown |
| **Оплата** | ЮMoney QuickPay |
| **AI** | Qwen-VL Plus через OpenRouter |

## Переменные окружения

### Backend

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `OPENROUTER_API_KEY` | Ключ OpenRouter | — |
| `AI_MODEL` | Модель AI | `qwen/qwen-vl-plus` |
| `HTTP_REFERER` | Referer для OpenRouter | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | Разрешённые CORS домены | `http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173` |
| `MAX_FILE_SIZE` | Макс. размер файла (байты) | `10485760` (10MB) |
| `JWT_SECRET` | Секретный ключ JWT | `dev-secret-change-me...` |
| `DATABASE_URL` | URL базы данных | `sqlite+aiosqlite:///./data/app.db` |
| `YMONEY_WALLET` | Кошелёк ЮMoney | — |
| `YMONEY_SUCCESS_URL` | URL после оплаты | `http://localhost:3000/payment/success` |
| `ADMIN_EMAIL` | Email администратора | - |

### Frontend

| Переменная | Описание |
|------------|----------|
| `VITE_API_URL` | URL API-сервера (опционально, в dev проксируется автоматически) |

## API

### Аутентификация

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/auth/register` | POST | Регистрация (email, password → 10₽ на баланс) |
| `/api/auth/login` | POST | Вход (email, password → JWT токен) |
| `/api/auth/me` | GET | Информация о текущем пользователе |

### Генерация

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/generate-description` | POST | Генерация описания (только для авторизованных) |
| `/api/history` | GET | История генераций пользователя |

### Оплата

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/payment/create` | POST | Создание платежа через ЮMoney |
| `/api/payment/notify` | POST | Webhook от ЮMoney |
| `/api/payment/status` | GET | Статус платежей пользователя |

### Админ-панель (только `ADMIN_EMAIL`)

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/admin/users` | GET | Список всех пользователей |
| `/api/admin/users` | POST | Создать пользователя |
| `/api/admin/users/{id}` | PUT | Изменить баланс/email |
| `/api/admin/users/{id}` | DELETE | Удалить пользователя |

### Health

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/health` | GET | Проверка состояния сервера |

## Лицензия

MIT
