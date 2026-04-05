import os
import base64
import io
import re
import time
from collections import defaultdict
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from PIL import Image
import httpx

load_dotenv()

app = FastAPI(title="Product Description Generator", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Rate limiting: 5 requests per minute per IP
rate_limit_store = defaultdict(list)
RATE_LIMIT = 5
RATE_WINDOW = 60  # seconds


def check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    # Очистка старых записей
    rate_limit_store[client_ip] = [t for t in rate_limit_store[client_ip] if now - t < RATE_WINDOW]
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT:
        return False
    rate_limit_store[client_ip].append(now)
    return True


PROMPTS = {
    "short": """Ты - профессиональный копирайтер.
Посмотри на фото товара и создай КРАТКОЕ продающее описание (2-3 предложения + 3 ключевые характеристики).

Структура:
1. Название товара (1 строка)
2. Краткое описание (2-3 предложения)
3. Ключевые характеристики (3 пункта)

На русском языке. Не используй placeholder тексты. Не используй markdown символы вроде **, #, ---. Просто чистый текст.""",

    "standard": """Ты - профессиональный копирайтер для интернет-магазина.
Посмотри на фото товара и создай продающее описание по структуре:

1. Название товара - короткое, привлекательное (1 строка)
2. Краткое описание - 2-3 предложения, подчеркивающие главные преимущества
3. Ключевые характеристики - список из 5-7 пунктов (каждый с новой строки через дефис)
4. Преимущества - 3-4 пункта, почему стоит купить именно этот товар
5. Призыв к действию - короткая фраза для покупки

На русском языке, живым и продающим стилем. Не используй placeholder тексты. Не используй markdown символы вроде **, #, ---. Просто чистый текст с нумерацией и дефисами.""",

    "seo": """Ты - SEO-копирайтер для маркетплейсов.
Посмотри на фото товара и создай SEO-оптимизированное описание:

1. Заголовок - с ключевыми словами для поиска (до 80 символов)
2. Описание для поиска - 3-4 предложения с ключевыми словами
3. Характеристики - 7-10 пунктов (каждый с новой строки через дефис)
4. Преимущества - 4-5 пунктов с эмоциональными триггерами
5. Ключевые слова для поиска - 5-8 тегов через запятую
6. Призыв к действию

Оптимизировано для Ozon, Wildberries, Яндекс.Маркет. На русском языке. Не используй markdown символы вроде **, #, ---. Просто чистый текст с нумерацией и дефисами."""
}


def optimize_image(image_bytes: bytes, max_size: int = 1024) -> bytes:
    """Оптимизирует изображение для отправки в API"""
    img = Image.open(io.BytesIO(image_bytes))
    if img.format != 'JPEG':
        img = img.convert('RGB')
    if max(img.size) > max_size:
        ratio = max_size / max(img.size)
        new_size = tuple(int(dim * ratio) for dim in img.size)
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=85)
    return output.getvalue()


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "api_configured": bool(OPENROUTER_API_KEY)}


@app.post("/api/generate-description")
async def generate_description(
    file: UploadFile = File(...),
    style: str = Form(default="standard")
):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")

    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Rate limiting
    client_ip = file.headers.get("x-forwarded-for", "127.0.0.1")
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Слишком много запросов. Подождите минуту."
        )

    # Validate style
    if style not in PROMPTS:
        style = "standard"

    try:
        image_bytes = await file.read()
        optimized_image = optimize_image(image_bytes)
        base64_image = base64.b64encode(optimized_image).decode('utf-8')
        image_url = f"data:image/jpeg;base64,{base64_image}"

        prompt = PROMPTS[style]
        max_tokens = 800 if style == "short" else 2000

        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={
                    "model": "qwen/qwen-vl-plus",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": image_url}},
                                {"type": "text", "text": prompt}
                            ]
                        }
                    ],
                    "max_tokens": max_tokens
                },
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Description Generator"
                }
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"API error: {response.text}"
            )

        data = response.json()
        description = data["choices"][0]["message"]["content"]

        # Убираем markdown символы
        description = re.sub(r'#{1,6}\s*', '', description)
        description = re.sub(r'\*\*', '', description)
        description = re.sub(r'(?<!\*)\*(?!\*)', '', description)
        description = re.sub(r'---+', '', description)
        description = re.sub(r'_+', '', description)
        description = description.strip()

        return {"description": description}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate description: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
