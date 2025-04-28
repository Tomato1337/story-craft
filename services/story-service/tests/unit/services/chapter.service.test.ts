import { describe, it, expect, beforeEach, vi } from 'vitest'
import { chapterStoryService } from './chapter.service'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
    prisma: {
        chapter: {
            count: vi.fn(),
            findMany: vi.fn(),
        },
    },
}))

describe('chapterStoryService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('getChaptersPaginated', () => {
        it('должен возвращать корректную пагинацию и вызовы prisma', async () => {
            const now = new Date()
            const fakeChapters = [
                { id: 'c1', createdAt: now, updatedAt: now },
                { id: 'c2', createdAt: now, updatedAt: now },
            ]
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
                items: fakeChapters.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.toISOString(),
                    updatedAt: item.updatedAt.toISOString(),
                })),
                totalCount: 5,
                totalPages: Math.ceil(5 / 2),
                page: 2,
                pageSize: 2,
            })
        })
    })
})
