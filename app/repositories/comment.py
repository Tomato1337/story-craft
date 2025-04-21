from uuid import UUID
from typing import Dict, Any, List, Optional
import asyncpg


class CommentRepository:
    def __init__(self, connection: asyncpg.Connection):
        self.connection = connection

    async def create(
            self,
            user_id: UUID,
            content_type: str,
            content_id: UUID,
            comment_text: str,
            parent_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Создание нового комментария

        Args:
            user_id: ID пользователя
            content_type: Тип контента (story, chapter)
            content_id: ID контента
            comment_text: Текст комментария
            parent_id: ID родительского комментария (для ответов)

        Returns:
            Dict: Созданный комментарий
        """
        query = """
            INSERT INTO comments (user_id, content_type, content_id, content, parent_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, user_id, content_type, content_id, content, parent_id, created_at, updated_at
        """
        record = await self.connection.fetchrow(
            query, user_id, content_type, content_id, comment_text, parent_id
        )
        return dict(record)

    async def get_by_id(self, comment_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Получение комментария по ID

        Args:
            comment_id: ID комментария

        Returns:
            Optional[Dict]: Комментарий или None, если не найден
        """
        query = """
            SELECT id, user_id, content_type, content_id, content, parent_id, 
                   created_at, updated_at
            FROM comments
            WHERE id = $1
        """
        record = await self.connection.fetchrow(query, comment_id)
        return dict(record) if record else None

    async def update(self, comment_id: UUID, new_content: str) -> Optional[Dict[str, Any]]:
        """
        Обновление комментария

        Args:
            comment_id: ID комментария
            new_content: Новый текст комментария

        Returns:
            Optional[Dict]: Обновленный комментарий или None, если не найден
        """
        query = """
            UPDATE comments
            SET content = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, user_id, content_type, content_id, content, parent_id, 
                     created_at, updated_at
        """
        record = await self.connection.fetchrow(query, new_content, comment_id)
        return dict(record) if record else None

    async def delete(self, comment_id: UUID) -> bool:
        """
        Удаление комментария

        Args:
            comment_id: ID комментария

        Returns:
            bool: True если комментарий был удален, False если не существовал
        """
        query = """
            DELETE FROM comments 
            WHERE id = $1
            RETURNING id
        """
        record = await self.connection.fetchrow(query, comment_id)
        return record is not None

    async def get_for_content(
            self,
            content_type: str,
            content_id: UUID,
            limit: int = 50,
            offset: int = 0,
            include_replies: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Получение комментариев для конкретного контента

        Args:
            content_type: Тип контента (story, chapter)
            content_id: ID контента
            limit: Лимит количества комментариев
            offset: Смещение для пагинации
            include_replies: Включать ли ответы на комментарии

        Returns:
            List[Dict]: Список комментариев
        """
        if include_replies:
            # Если нужны все комментарии, включая ответы
            query = """
                SELECT id, user_id, content_type, content_id, content, parent_id, 
                       created_at, updated_at
                FROM comments
                WHERE content_type = $1 AND content_id = $2
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4
            """
        else:
            # Если нужны только комментарии верхнего уровня (без ответов)
            query = """
                SELECT id, user_id, content_type, content_id, content, parent_id, 
                       created_at, updated_at
                FROM comments
                WHERE content_type = $1 AND content_id = $2 AND parent_id IS NULL
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4
            """

        records = await self.connection.fetch(
            query, content_type, content_id, limit, offset
        )
        return [dict(record) for record in records]

    async def get_replies(self, parent_id: UUID) -> List[Dict[str, Any]]:
        """
        Получение всех ответов на комментарий

        Args:
            parent_id: ID родительского комментария

        Returns:
            List[Dict]: Список ответов на комментарий
        """
        query = """
            SELECT id, user_id, content_type, content_id, content, parent_id, 
                   created_at, updated_at
            FROM comments
            WHERE parent_id = $1
            ORDER BY created_at ASC
        """
        records = await self.connection.fetch(query, parent_id)
        return [dict(record) for record in records]

    async def get_user_comments(self, user_id: UUID, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Получение всех комментариев пользователя

        Args:
            user_id: ID пользователя
            limit: Лимит количества комментариев
            offset: Смещение для пагинации

        Returns:
            List[Dict]: Список комментариев пользователя
        """
        query = """
            SELECT id, user_id, content_type, content_id, content, parent_id, 
                   created_at, updated_at
            FROM comments
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        """
        records = await self.connection.fetch(query, user_id, limit, offset)
        return [dict(record) for record in records]

    async def get_count(self, content_type: str, content_id: UUID) -> int:
        """
        Получение количества комментариев для контента

        Args:
            content_type: Тип контента (story, chapter)
            content_id: ID контента

        Returns:
            int: Количество комментариев
        """
        query = """
            SELECT COUNT(*) as count
            FROM comments
            WHERE content_type = $1 AND content_id = $2
        """
        record = await self.connection.fetchrow(query, content_type, content_id)
        return record['count']
