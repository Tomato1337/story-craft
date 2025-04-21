import uvicorn
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.connection import initialize_db_pool, close_db_pool

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application")
    await initialize_db_pool()

    yield

    logger.info("Shutting down application")
    await close_db_pool()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API для управления социальными взаимодействиями",
    version="0.1.0",
    lifespan=lifespan,
)

# Настройка Cross-Origin Resource Sharing для возможности запросов с других доменов
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],# Разрешает запросы со всех источников (в продакшен версии заменить)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health Check"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3005,
        reload=True
    )
