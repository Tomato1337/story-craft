import asyncpg
from typing import Optional, Any, Dict, List, Type, TypeVar, Generic
from uuid import UUID

T = TypeVar('T')


class BaseRepository:
    def __init__(self, connection: asyncpg.Connection):
        """
        Инициализация репозитория с соединением к БД

        Args:
            connection: Соединение с базой данных
        """
        self.connection = connection

    async def execute(self, query: str, *args) -> str:
        """
        Выполнение SQL-запроса без возврата результата

        Args:
            query: SQL запрос
            *args: Параметры для запроса

        Returns:
            str: Статус выполнения
        """
        return await self.connection.execute(query, *args)

    async def fetch(self, query: str, *args) -> List[Dict[str, Any]]:
        """
        Выполнение SQL-запроса с возвратом множества записей

        Args:
            query: SQL запрос
            *args: Параметры для запроса

        Returns:
            List[Dict[str, Any]]: Список записей
        """
        records = await self.connection.fetch(query, *args)
        return [dict(record) for record in records]

    async def fetchrow(self, query: str, *args) -> Optional[Dict[str, Any]]:
        """
        Выполнение SQL-запроса с возвратом одной записи

        Args:
            query: SQL запрос
            *args: Параметры для запроса

        Returns:
            Optional[Dict[str, Any]]: Запись или None
        """
        record = await self.connection.fetchrow(query, *args)
        return dict(record) if record else None