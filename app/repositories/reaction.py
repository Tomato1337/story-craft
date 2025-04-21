from uuid import UUID
from typing import Dict, Any, List, Optional
import asyncpg
from app.repositories.base import BaseRepository


class ReactionRepository(BaseRepository):
    async def create(self, user_id: UUID, content_type: str, content_id: UUID, reaction_type: str) -> Dict[str, Any]:
        """
        Создание новой реакции

        Args:
            user_id: ID пользователя
            content_type: Тип контента (story, chapter, comment)
            content_id: ID контента
            reaction_type: Тип реакции (like, bookmark)

        Returns:
            Dict: Созданная реакция
        """
        query = """
            INSERT INTO reactions (user_id, content_type, content_id, reaction_type)
            VALUES ($1, $2, $3, $4)
            RETURNING id, user_id, content_type, content_id, reaction_type, created_at
        """
        try:
            return await self.fetchrow(query, user_id, content_type, content_id, reaction_type)
        except asyncpg.UniqueViolationError:
            # Если реакция уже существует, просто возвращаем её
            return await self.get_by_params(user_id, content_type, content_id, reaction_type)

    async def delete(self, user_id: UUID, content_type: str, content_id: UUID, reaction_type: str) -> bool:
        """
        Удаление существующей реакции

        Args:
            user_id: ID пользователя
            content_type: Тип контента (story, chapter, comment)
            content_id: ID контента
            reaction_type: Тип реакции (like, bookmark)

        Returns:
            bool: True если реакция была удалена, False если не существовала
        """
        query = """
            DELETE FROM reactions 
            WHERE user_id = $1 AND content_type = $2 AND content_id = $3 AND reaction_type = $4
            RETURNING id
        """
        record = await self.fetchrow(query, user_id, content_type, content_id, reaction_type)
        return record is not None

    async def get_by_params(self, user_id: UUID, content_type: str, content_id: UUID, reaction_type: str) -> Optional[
        Dict[str, Any]]:
        """
        Получение реакции по параметрам

        Args:
            user_id: ID пользователя
            content_type: Тип контента (story, chapter, comment)
            content_id: ID контента
            reaction_type: Тип реакции (like, bookmark)

        Returns:
            Optional[Dict]: Реакция или None, если не найдена
        """
        query = """
            SELECT id, user_id, content_type, content_id, reaction_type, created_at
            FROM reactions
            WHERE user_id = $1 AND content_type = $2 AND content_id = $3 AND reaction_type = $4
        """
        return await self.fetchrow(query, user_id, content_type, content_id, reaction_type)

    async def get_count(self, content_type: str, content_id: UUID, reaction_type: str) -> int:
        """
        Получение количества реакций определенного типа для контента

        Args:
            content_type: Тип контента (story, chapter, comment)
            content_id: ID контента
            reaction_type: Тип реакции (like, bookmark)

        Returns:
            int: Количество реакций
        """
        query = """
            SELECT COUNT(*) as count
            FROM reactions
            WHERE content_type = $1 AND content_id = $2 AND reaction_type = $3
        """
        record = await self.fetchrow(query, content_type, content_id, reaction_type)
        return record['count']

    async def get_user_reactions(self, user_id: UUID, reaction_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Получение всех реакций пользователя

        Args:
            user_id: ID пользователя
            reaction_type: Опционально - тип реакции для фильтрации

        Returns:
            List[Dict]: Список реакций пользователя
        """
        if reaction_type:
            query = """
                SELECT id, user_id, content_type, content_id, reaction_type, created_at
                FROM reactions
                WHERE user_id = $1 AND reaction_type = $2
                ORDER BY created_at DESC
            """
            return await self.fetch(query, user_id, reaction_type)
        else:
            query = """
                SELECT id, user_id, content_type, content_id, reaction_type, created_at
                FROM reactions
                WHERE user_id = $1
                ORDER BY created_at DESC
            """
            return await self.fetch(query, user_id)