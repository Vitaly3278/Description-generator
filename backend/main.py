import os
import base64
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from PIL import Image
import httpx

load_dotenv()

app = FastAPI(title="Product Description Generator", version="1.0.0")

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

SYSTEM_PROMPT = """Ты - профессиональный копирайтер для интернет-магазина.
Посмотри на фото товара и создай продающее описание по следующей структуре:

1. **Название товара** - короткое, привлекательное (1 строка)
2. **Краткое описание** - 2-3 предложения, подчеркивающие главные преимущества
3. **Ключевые характеристики** - список из 5-7 пунктов
4. **Преимущества** - 3-4 пункта, почему стоит купить именно этот товар
5. **Призыв к действию** - короткая фраза для покупки

Описание должно быть на русском языке, живым и продающим стилем.
Не используй placeholder тексты вроде [Название товара] - пиши конкретное название."""


def optimize_image(image_bytes: bytes, max_size: int = 1024) -> bytes:
    """Оптимизирует изображение для отправки в API"""
    img = Image.open(io.BytesIO(image_bytes))
    
    # Конвертируем в JPEG если нужно
    if img.format != 'JPEG':
        img = img.convert('RGB')
    
    # Масштабируем если изображение слишком большое
    if max(img.size) > max_size:
        ratio = max_size / max(img.size)
        new_size = tuple(int(dim * ratio) for dim in img.size)
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # Сохраняем в JPEG
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=85)
    return output.getvalue()


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "api_configured": bool(OPENROUTER_API_KEY)}


@app.post("/api/generate-description")
async def generate_description(file: UploadFile = File(...)):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    # Проверяем тип файла
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    try:
        # Читаем и оптимизируем изображение
        image_bytes = await file.read()
        optimized_image = optimize_image(image_bytes)
        
        # Конвертируем в base64
        base64_image = base64.b64encode(optimized_image).decode('utf-8')
        image_url = f"data:image/jpeg;base64,{base64_image}"

        # Запрос к OpenRouter API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={
                    "model": "qwen/qwen-vl-plus",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image_url",
                                    "image_url": {"url": image_url}
                                },
                                {
                                    "type": "text",
                                    "text": SYSTEM_PROMPT
                                }
                            ]
                        }
                    ],
                    "max_tokens": 2000
                },
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Product Description Generator"
                }
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"API error: {response.text}"
            )
        
        data = response.json()
        description = data["choices"][0]["message"]["content"]
        
        return {"description": description}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate description: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
