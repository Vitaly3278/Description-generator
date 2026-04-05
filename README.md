# Product Description Generator

Генерация продающих описаний товаров по фото с помощью ИИ (Qwen-VL через OpenRouter).

## Структура проекта

```
description/
├── backend/          # FastAPI бэкенд
│   ├── main.py       # Основной файл приложения
│   ├── requirements.txt
│   └── .env          # API ключ (создать самостоятельно)
└── frontend/         # React фронтенд
    ├── src/
    │   ├── App.js
    │   └── App.css
    └── package.json
```

## Настройка

### 1. Бэкенд (FastAPI)

```bash
cd backend

# Создаем виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Устанавливаем зависимости
pip install -r requirements.txt

# Создаем .env файл с API ключом
cp .env.example .env
# Редактируем .env, добавляем свой OPENROUTER_API_KEY

# Запускаем сервер
python main.py
```

### 2. Фронтенд (React)

```bash
cd frontend

# Устанавливаем зависимости
npm install

# Запускаем dev сервер
npm start
```

## Получение API ключа (OpenRouter)

1. Зайди на https://openrouter.ai/
2. Зарегистрируйся через Google/GitHub
3. Перейди в Keys (https://openrouter.ai/keys)
4. Создай новый ключ (Create Key)
5. Скопируй и вставь в `backend/.env`:

```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
```

> 💡 **Бесплатный тариф:** OpenRouter даёт бесплатные кредиты при регистрации. Также есть бесплатные модели.

## Использование

1. Получи API ключ на OpenRouter
2. Добавь ключ в `backend/.env`
3. Запусти бэкенд (порт 5000)
4. Запусти фронтенд (порт 3000)
5. Загрузи фото товара и нажми «Сгенерировать описание»

## Технологии

- **Backend:** FastAPI, httpx, Pillow
- **Frontend:** React, CSS
- **AI:** Qwen-VL Plus (через OpenRouter)
