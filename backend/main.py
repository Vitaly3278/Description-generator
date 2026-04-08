import os
import base64
import io
import re
import time
import logging
import hashlib
from collections import defaultdict
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv
from PIL import Image, UnidentifiedImageError
import httpx

from database import init_db, get_db, User, Generation, Payment
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, security
)
from jose import jwt, JWTError
from auth import SECRET_KEY, ALGORITHM

load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


# ======================== Lifespan ========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Database initialized")
    yield


app = FastAPI(title="Product Description Generator", version="3.0.0", lifespan=lifespan)

# ======================== CORS ========================

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================== Config ========================

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
AI_MODEL = os.getenv("AI_MODEL", "qwen/qwen-vl-plus")
HTTP_REFERER = os.getenv("HTTP_REFERER", "http://localhost:3000")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10 * 1024 * 1024))

YMONEY_WALLET = os.getenv("YMONEY_WALLET", "4100119509739491")
YMONEY_SECRET_KEY = os.getenv("YMONEY_SECRET_KEY", "")
YMONEY_SUCCESS_URL = os.getenv("YMONEY_SUCCESS_URL", "http://localhost:3000/payment/success")

FREE_GENERATIONS = 10  # ₽ на баланс при регистрации
COST_PER_GENERATION = 10.0  # одна генерация = 10₽

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "vital-nvl@mail.ru")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator('password')
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
        return v

# Rate limiting
rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 5
RATE_WINDOW = 60
RATE_LIMIT_CLEANUP_INTERVAL = 300
last_cleanup_time = 0.0


def _cleanup_rate_limit_store(now: float) -> None:
    expired_ips = [
        ip for ip, timestamps in rate_limit_store.items()
        if not any(now - t < RATE_WINDOW for t in timestamps)
    ]
    for ip in expired_ips:
        del rate_limit_store[ip]


def check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    global last_cleanup_time
    if now - last_cleanup_time > RATE_LIMIT_CLEANUP_INTERVAL:
        _cleanup_rate_limit_store(now)
        last_cleanup_time = now
    rate_limit_store[client_ip] = [t for t in rate_limit_store[client_ip] if now - t < RATE_WINDOW]
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT:
        return False
    rate_limit_store[client_ip].append(now)
    return True


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


# ======================== Pydantic Models ========================

class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class PaymentRequest(BaseModel):
    amount: int  # в рублях


# ======================== Prompts ========================

PROMPTS = {
    "short": """Ты - профессиональный копирайтер.
Посмотри на фото товара и создай КРАТКОЕ продающее описание (2-3 предложения + 3 ключевые характеристики).

Структура:
1. Название товара (1 строка)
2. Краткое описание (2-3 предложения)
3. Ключевые характеристики (3 пункта через дефис)

На русском языке. Не используй placeholder тексты. Просто чистый текст без markdown.""",

    "standard": """Ты - профессиональный копирайтер для интернет-магазина.
Посмотри на фото товара и создай продающее описание по структуре:

1. Название товара - короткое, привлекательное (1 строка)
2. Краткое описание - 2-3 предложения, подчеркивающие главные преимущества
3. Характеристики - список из 5-7 пунктов (каждый с новой строки через дефис)
4. Преимущества - 3-4 пункта, почему стоит купить именно этот товар
5. Призыв к действию - короткая фраза для покупки

На русском языке, живым и продающим стилем. Не используй placeholder тексты. Просто чистый текст без markdown.""",

    "seo": """Ты - SEO-копирайтер для маркетплейсов.
Посмотри на фото товара и создай SEO-оптимизированное описание:

1. Заголовок - с ключевыми словами для поиска (до 80 символов)
2. Описание - 3-4 предложения с ключевыми словами
3. Характеристики - 7-10 пунктов (каждый с новой строки через дефис)
4. Преимущества - 4-5 пунктов с эмоциональными триггерами
5. Ключевые слова - 5-8 тегов через запятую
6. Призыв к действию

Оптимизировано для Ozon, Wildberries, Яндекс.Маркет. На русском языке. Просто чистый текст без markdown."""
}


# ======================== Helpers ========================

def optimize_image(image_bytes: bytes, max_size: int = 1024) -> bytes:
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except (UnidentifiedImageError, OSError) as e:
        raise ValueError(f"Неверный формат изображения: {e}")
    if img.format != 'JPEG':
        img = img.convert('RGB')
    if max(img.size) > max_size:
        ratio = max_size / max(img.size)
        new_size = tuple(int(dim * ratio) for dim in img.size)
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=85)
    return output.getvalue()


# ======================== Auth Endpoints ========================

@app.post("/api/auth/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    # Первый пользователь становится админом
    result = await db.execute(select(User))
    users_count = len(result.scalars().all())
    is_first_user = users_count == 0

    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        balance=FREE_GENERATIONS,
        is_admin=is_first_user
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "balance": user.balance, "is_admin": user.is_admin}
    }


@app.post("/api/auth/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_access_token({"sub": user.id})
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "balance": user.balance, "is_admin": user.is_admin}
    }


@app.get("/api/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "balance": user.balance, "is_admin": user.is_admin}


# ======================== Payment (ЮMoney) ========================

@app.post("/api/payment/create")
async def create_payment(
    data: PaymentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создаёт платёж через ЮMoney QuickPay."""
    if data.amount < 1:
        raise HTTPException(status_code=400, detail="Минимальная сумма — 1₽")

    # Уникальная метка платежа
    ym_label = f"gen_{user.id}_{int(time.time())}_{hashlib.md5(f'{user.id}{time.time()}'.encode()).hexdigest()[:8]}"

    payment = Payment(
        user_id=user.id,
        amount=data.amount,
        ym_label=ym_label,
        status="pending"
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    # Формируем URL для ЮMoney QuickPay (СБП — оплата по QR)
    ym_url = (
        f"https://yoomoney.ru/quickpay/confirm?receiver={YMONEY_WALLET}"
        f"&quickpay-form=shop&targets=Пополнение баланса Description Generator"
        f"&paymentType=SBP&sum={data.amount}"
        f"&label={ym_label}"
        f"&successURL={YMONEY_SUCCESS_URL}"
    )

    return {"payment_id": payment.id, "ym_url": ym_url, "ym_label": ym_label}


@app.post("/api/payment/notify")
async def payment_notify(request: Request, db: AsyncSession = Depends(get_db)):
    """Webhook от ЮMoney о совершённом платеже."""
    form_data = await request.form()

    notification_type = form_data.get("notification_type")
    operation_id = form_data.get("operation_id")
    amount = form_data.get("amount")
    label = form_data.get("label")

    if notification_type != "p2p-incoming":
        return {"status": "ignored"}

    if not label:
        return {"status": "no_label"}

    # Ищем платёж по label
    result = await db.execute(select(Payment).where(Payment.ym_label == label))
    payment = result.scalar_one_or_none()
    if not payment or payment.status == "success":
        return {"status": "already_processed" if payment and payment.status == "success" else "not_found"}

    # Проверяем что сумма совпадает с записью в БД
    if float(amount) != payment.amount:
        logger.warning("Payment amount mismatch: expected %.2f, got %s", payment.amount, amount)
        return {"status": "amount_mismatch"}

    # Обновляем платёж и баланс
    payment.status = "success"
    payment.paid_at = datetime.now(timezone.utc)
    payment_user = await db.execute(select(User).where(User.id == payment.user_id))
    user = payment_user.scalar_one_or_none()
    if user:
        user.balance += payment.amount  # используем сумму из БД, не из формы

    await db.commit()
    logger.info("Payment %s confirmed: %.2f₽ for user %d", label, payment.amount, payment.user_id)
    return {"status": "ok"}


@app.get("/api/payment/status")
async def payment_status(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Статус платежей пользователя."""
    result = await db.execute(select(Payment).where(Payment.user_id == user.id).order_by(Payment.created_at.desc()))
    payments = result.scalars().all()
    return {
        "balance": user.balance,
        "payments": [
            {"id": p.id, "amount": p.amount, "status": p.status, "created_at": str(p.created_at)}
            for p in payments
        ]
    }


# ======================== Admin ========================

async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Проверяет, что пользователь — админ (is_admin=True)."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=403, detail="Forbidden")
        user_id = int(user_id_str)
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None or not user.is_admin:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator('password')
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Пароль должен содержать минимум 8 символов')
        return v

    balance: float = 0.0

    @field_validator('balance')
    @classmethod
    def balance_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError('Баланс не может быть отрицательным')
        return v


class AdminUserUpdate(BaseModel):
    balance: Optional[float] = None
    email: Optional[EmailStr] = None

    @field_validator('balance')
    @classmethod
    def balance_non_negative(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError('Баланс не может быть отрицательным')
        return v


@app.get("/api/admin/users")
async def admin_get_users(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Список всех пользователей (только админ)."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()

    # Подсчёт генераций отдельным запросом
    gen_counts = await db.execute(
        select(Generation.user_id, func.count(Generation.id))
        .group_by(Generation.user_id)
    )
    count_map = dict(gen_counts.all())

    return [
        {
            "id": u.id,
            "email": u.email,
            "balance": u.balance,
            "created_at": str(u.created_at),
            "updated_at": str(u.updated_at),
            "generation_count": count_map.get(u.id, 0)
        }
        for u in users
    ]


@app.post("/api/admin/users")
async def admin_create_user(
    data: AdminUserCreate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Создать пользователя (только админ)."""
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        balance=data.balance
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "balance": user.balance,
        "created_at": str(user.created_at)
    }


@app.put("/api/admin/users/{user_id}")
async def admin_update_user(
    user_id: int,
    data: AdminUserUpdate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Обновить пользователя (только админ)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if data.balance is not None:
        user.balance = data.balance
    if data.email is not None:
        user.email = data.email

    await db.commit()
    await db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "balance": user.balance,
        "updated_at": str(user.updated_at)
    }


@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(
    user_id: int,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Удалить пользователя (только админ)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    await db.delete(user)
    await db.commit()
    return {"status": "ok", "deleted_user_id": user_id}


# ======================== Generation ========================

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "api_configured": bool(OPENROUTER_API_KEY)}


@app.post("/api/generate-description")
async def generate_description(
    request: Request,
    file: UploadFile = File(...),
    style: str = Form(default="short"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Генерация описания — только для авторизованных."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")

    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Rate limiting
    client_ip = get_client_ip(request)
    if not check_rate_limit(client_ip):
        logger.warning("Rate limit exceeded for IP: %s", client_ip)
        raise HTTPException(status_code=429, detail="Слишком много запросов. Подождите минуту.")

    if style not in PROMPTS:
        style = "short"

    # Проверка баланса
    if user.balance < COST_PER_GENERATION:
        raise HTTPException(
            status_code=402,
            detail=f"Баланс: {user.balance:.0f}₽. Для генерации нужно {COST_PER_GENERATION:.0f}₽. Пополните баланс в разделе «Пополнить».",
            headers={"X-Balance": str(user.balance)}
        )

    try:
        image_bytes = await file.read()
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"Файл слишком большой (макс. {MAX_FILE_SIZE // 1024 // 1024}MB)")

        optimized_image = optimize_image(image_bytes)
        base64_image = base64.b64encode(optimized_image).decode('utf-8')
        image_url = f"data:image/jpeg;base64,{base64_image}"

        prompt = PROMPTS[style]
        max_tokens = 800 if style == "short" else 2000

        logger.info("User %d generating with style='%s', balance=%.1f", user.id, style, user.balance)

        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={
                    "model": AI_MODEL,
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
                    "HTTP-Referer": HTTP_REFERER,
                    "X-Title": "Description Generator"
                }
            )

        if response.status_code != 200:
            logger.error("OpenRouter API error: %d %s", response.status_code, response.text)
            raise HTTPException(status_code=response.status_code, detail=f"API error: {response.text}")

        data_resp = response.json()
        description = data_resp["choices"][0]["message"]["content"]

        # Очистка markdown
        description = re.sub(r'#{1,6}\s*', '', description)
        description = re.sub(r'\*\*', '', description)
        description = re.sub(r'(?<!\*)\*(?!\*)', '', description)
        description = re.sub(r'---+', '', description)
        description = re.sub(r'_+', '', description)
        description = description.strip()

        # Списание баланса и сохранение (оптимистическая блокировка)
        # Перечитываем пользователя для актуального баланса
        await db.refresh(user)
        if user.balance < COST_PER_GENERATION:
            raise HTTPException(
                status_code=402,
                detail=f"Баланс: {user.balance:.0f}₽. Для генерации нужно {COST_PER_GENERATION:.0f}₽. Пополните баланс в разделе «Пополнить».",
                headers={"X-Balance": str(user.balance)}
            )

        user.balance -= COST_PER_GENERATION
        gen = Generation(
            user_id=user.id,
            style=style,
            description=description,
            cost=COST_PER_GENERATION
        )
        db.add(gen)
        await db.commit()

        logger.info("Description generated (%d chars), new balance: %.1f", len(description), user.balance)
        return {
            "description": description,
            "balance": user.balance
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning("Invalid image from user %d: %s", user.id, e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate description: {str(e)}")


# ======================== User History ========================

@app.get("/api/history")
async def get_history(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Generation).where(Generation.user_id == user.id).order_by(Generation.created_at.desc()).limit(50)
    )
    generations = result.scalars().all()
    return [
        {
            "id": g.id,
            "style": g.style,
            "description": g.description,
            "cost": g.cost,
            "created_at": str(g.created_at)
        }
        for g in generations
    ]


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
