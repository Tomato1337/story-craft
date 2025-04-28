import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storyService } from './story.service'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
    prisma: {
        story: {
            count: vi.fn(),
            findMany: vi.fn(),
        },
    },
}))

describe('storyService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('getStoriesPaginated', () => {
        it('должен возвращать корректную пагинацию и вызывать prisma', async () => {
            const now = new Date()
            const fakeStories = [
                {
                    id: 's1',
                    createdAt: now,
                    updatedAt: now,
                    proposalDeadline: null,
                    votingDeadline: null,
                },
                {
                    id: 's2',
                    createdAt: now,
                    updatedAt: now,
                    proposalDeadline: null,
                    votingDeadline: null,
                },
            ]
            ;(prisma.story.count as any).mockResolvedValue(4)
            ;(prisma.story.findMany as any).mockResolvedValue(fakeStories)

            const result = await storyService.getStoriesPaginated(2, 2)

            expect(prisma.story.count).toHaveBeenCalledWith()
            expect(prisma.story.findMany).toHaveBeenCalledWith({
                orderBy: { updatedAt: 'desc' },
                skip: 2,
                take: 2,
                include: { storyCollaborators: true, genres: true },
            })
            expect(result).toEqual({
                items: fakeStories.map((item) => ({
                    ...item,
                    createdAt: item.createdAt.toISOString(),
                    updatedAt: item.updatedAt.toISOString(),
                    proposalDeadline: null,
                    votingDeadline: null,
                })),
                totalCount: 4,
                totalPages: Math.ceil(4 / 2),
                page: 2,
                pageSize: 2,
            })
        })
    })
})
