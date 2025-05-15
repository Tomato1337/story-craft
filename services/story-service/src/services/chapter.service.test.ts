import { describe, it, expect, beforeEach, vi } from 'vitest'
import { chapterStoryService } from './chapter.service'
import { prisma } from '../prisma'
import { NotFoundError } from '../utils/errors'

vi.mock('../prisma', () => ({
    prisma: {
        story: {
            count: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        chapter: {
            count: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}))

describe('chapterStoryService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('createChapter', () => {
        it('должен создавать новую главу с правильными данными', async () => {
            const now = new Date()
            const storyId = 'story1'
            const authorId = 'author1'
            const chapterData = {
                title: 'Новая глава',
                content: 'Содержание новой главы',
            }

            ;(prisma.story.findUnique as any).mockResolvedValue({ id: storyId })
            ;(prisma.chapter.count as any).mockResolvedValue(3)
            const createdChapter = {
                id: 'chapter1',
                title: chapterData.title,
                content: chapterData.content,
                authorId,
                storyId,
                position: 4,
                isLastChapter: true,
                createdAt: now,
                updatedAt: now,
            }
            ;(prisma.chapter.create as any).mockResolvedValue(createdChapter)

            const result = await chapterStoryService.createChapter(
                storyId,
                chapterData,
                authorId
            )

            expect(prisma.story.findUnique).toHaveBeenCalledWith({
                where: { id: storyId },
            })
            expect(prisma.chapter.count).toHaveBeenCalledWith({
                where: { storyId },
            })
            expect(prisma.chapter.create).toHaveBeenCalledWith({
                data: {
                    title: chapterData.title,
                    content: chapterData.content,
                    authorId,
                    storyId,
                    position: 4, // 3 + 1
                    isLastChapter: true,
                },
            })
            expect(result).toEqual(createdChapter)
        })

        it('должен выбросить ошибку, если история не найдена', async () => {
            const storyId = 'nonexistent'

            ;(prisma.story.findUnique as any).mockResolvedValue(null)

            await expect(
                chapterStoryService.createChapter(
                    storyId,
                    { title: 'Тест', content: 'Контент' },
                    'author1'
                )
            ).rejects.toThrow(NotFoundError)
            expect(prisma.story.findUnique).toHaveBeenCalledWith({
                where: { id: storyId },
            })
            expect(prisma.chapter.create).not.toHaveBeenCalled()
        })
    })

    describe('getChapterById', () => {
        it('должен возвращать главу по ID', async () => {
            const now = new Date()
            const chapterId = 'chapter1'
            const chapterData = {
                id: chapterId,
                title: 'Тестовая глава',
                content: 'Содержание главы',
                authorId: 'author1',
                storyId: 'story1',
                position: 1,
                isLastChapter: true,
                createdAt: now,
                updatedAt: now,
            }

            ;(prisma.chapter.findUnique as any).mockResolvedValue(chapterData)

            const result = await chapterStoryService.getChapterById(chapterId)

            expect(prisma.chapter.findUnique).toHaveBeenCalledWith({
                where: { id: chapterId },
            })
            expect(result).toEqual(chapterData)
        })

        it('должен выбросить ошибку, если глава не найдена', async () => {
            const chapterId = 'nonexistent'

            ;(prisma.chapter.findUnique as any).mockResolvedValue(null)

            await expect(
                chapterStoryService.getChapterById(chapterId)
            ).rejects.toThrow(NotFoundError)
            expect(prisma.chapter.findUnique).toHaveBeenCalledWith({
                where: { id: chapterId },
            })
        })
    })

    describe('getChaptersPaginated', () => {
        it('должен возвращать корректную пагинацию и вызовы prisma', async () => {
            const now = new Date()
            const fakeChapters = [
                { id: 'c1', createdAt: now, updatedAt: now },
                { id: 'c2', createdAt: now, updatedAt: now },
                { id: 'c3', createdAt: now, updatedAt: now },
                { id: 'c4', createdAt: now, updatedAt: now },
                { id: 'c5', createdAt: now, updatedAt: now },
            ]
            ;(prisma.story.findUnique as any).mockResolvedValue({
                id: 'story1',
            })
            ;(prisma.chapter.count as any).mockResolvedValue(5)
            ;(prisma.chapter.findMany as any).mockResolvedValue(fakeChapters)

            const result = await chapterStoryService.getChaptersPaginated(
                'story1',
                2,
                2
            )

            expect(prisma.chapter.count).toHaveBeenCalledWith({
                where: { storyId: 'story1' },
            })
            expect(prisma.chapter.findMany).toHaveBeenCalledWith({
                where: { storyId: 'story1' },
                orderBy: { position: 'asc' },
                skip: 2,
                take: 2,
            })
            expect(result).toEqual({
                items: fakeChapters,
                totalCount: 5,
                totalPages: Math.ceil(5 / 2),
                page: 2,
                pageSize: 2,
            })
        })

        it('должен выбросить ошибку, если история не найдена', async () => {
            const storyId = 'nonexistent'
            // Настраиваем моки
            ;(prisma.story.findUnique as any).mockResolvedValue(null)

            // Проверяем, что метод выбрасывает ошибку
            await expect(
                chapterStoryService.getChaptersPaginated(storyId)
            ).rejects.toThrow(NotFoundError)
            expect(prisma.story.findUnique).toHaveBeenCalledWith({
                where: { id: storyId },
            })
            expect(prisma.chapter.findMany).not.toHaveBeenCalled()
        })
    })
})
