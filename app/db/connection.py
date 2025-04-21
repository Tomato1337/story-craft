import asyncpg
import logging
from typing import AsyncGenerator
from app.core.config import settings

pool: asyncpg.Pool = None


async def initialize_db_pool() -> None:
    global pool

    logging.info("Initializing database connection pool")
    try:
        pool = await asyncpg.create_pool(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            min_size=5,
            max_size=20
        )
        logging.info("Database connection pool initialized successfully")
    except Exception as e:
        logging.error(f"Error initializing database connection pool: {e}")
        raise


async def close_db_pool() -> None:
    global pool
    if pool:
        await pool.close()
        logging.info("Database connection pool closed")


async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    global pool
    if pool is None:
        raise RuntimeError("Database connection pool not initialized")

    async with pool.acquire() as conn:
        yield conn
