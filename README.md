# Description Generator

Генерация продающих описаний товаров по фото с помощью ИИ.

> Загрузите фотографию товара — нейросеть создаст профессиональное описание с характеристиками, преимуществами и призывом к покупке.

## Скриншот

![Скриншот](screenshot.png)

## Возможности

- ✨ **AI-анализ фото** — нейросеть Qwen-VL распознаёт товар по изображению
- 🌍 **Русский язык** — описания генерируются на русском языке
- ⚡ **Быстро** — готовое описание за 10-15 секунд
- 📋 **Копирование** — одним кликом в буфер обмена
- 🔒 **Без регистрации** — нужен только API ключ
- 📱 **Адаптивный дизайн** — работает на любых устройствах

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
├── backend/                # FastAPI (Python)
│   ├── main.py             # API сервер + интеграция с OpenRouter
│   ├── requirements.txt    # Python зависимости
│   └── .env.example        # Пример .env файла
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── App.js          # Основной компонент
│   │   ├── components/     # Подкомпоненты
│   │   │   ├── UploadZone.js
│   │   │   ├── ProgressBar.js
│   │   │   ├── ResultDisplay.js
│   │   │   └── HistoryPanel.js
│   │   └── App.css         # Стили
│   ├── index.html          # Vite entry point
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## Технологии

| Слой | Технология |
|------|------------|
| **Backend** | FastAPI, httpx, Pillow |
| **Frontend** | React 19, Vite, react-markdown |
| **AI** | Qwen-VL Plus через OpenRouter |

## Переменные окружения

### Backend

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `OPENROUTER_API_KEY` | Ключ OpenRouter | — |
| `AI_MODEL` | Модель AI | `qwen/qwen-vl-plus` |
| `HTTP_REFERER` | Referer для OpenRouter | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | Разрешённые CORS домены | `http://localhost:3000,http://localhost:5173` |
| `MAX_FILE_SIZE` | Макс. размер файла (байты) | `10485760` (10MB) |

### Frontend

| Переменная | Описание |
|------------|----------|
| `VITE_API_URL` | URL API-сервера (опционально, в dev проксируется автоматически) |

## API

### `POST /api/generate-description`

Загрузите изображение — получите описание товара.

**Request:** `multipart/form-data` с полем `file` (изображение)

**Response:**
```json
{
  "description": "**Название товара**\n\nОписание...\n\n**Характеристики:**\n- ..."
}
```

### `GET /api/health`

Проверка состояния сервера.

```json
{ "status": "ok", "api_configured": true }
```

## Лицензия

MIT
