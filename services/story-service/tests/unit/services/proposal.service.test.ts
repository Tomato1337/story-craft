import { describe, it, expect, beforeEach, vi } from 'vitest'
import { proposalService } from './proposal.service'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
    prisma: {
        chapterProposal: {
            count: vi.fn(),
            findMany: vi.fn(),
        },
    },
}))

describe('proposalService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('getProposalsPaginated', () => {
        it('должен возвращать корректные данные и флаг hasWon=false', async () => {
            const now = new Date()
            const fakeProps = [
                {
                    id: 'p1',
                    voteCount: 0,
                    storyId: 's1',
                    parentChapterId: 'c1',
                    authorId: 'u1',
                    title: 't1',
                    content: 'c1',
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: 'p2',
                    voteCount: 2,
                    storyId: 's1',
                    parentChapterId: 'c1',
                    authorId: 'u1',
                    title: 't2',
                    content: 'c2',
                    createdAt: now,
                    updatedAt: now,
                },
            ]
            ;(prisma.chapterProposal.count as any).mockResolvedValue(2)
            ;(prisma.chapterProposal.findMany as any).mockResolvedValue(
                fakeProps
            )

            const result = await proposalService.getProposalsPaginated(
                's1',
                'c1',
                1,
                10
            )

            expect(prisma.chapterProposal.count).toHaveBeenCalledWith({
                where: { storyId: 's1', parentChapterId: 'c1' },
            })
            expect(prisma.chapterProposal.findMany).toHaveBeenCalledWith({
                where: { storyId: 's1', parentChapterId: 'c1' },
                orderBy: { createdAt: 'asc' },
                skip: 0,
                take: 10,
            })
            expect(result).toEqual({
                items: fakeProps.map((p) => ({
                    ...p,
                    hasWon: false,
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString(),
                })),
                totalCount: 2,
                totalPages: 1,
                page: 1,
                pageSize: 10,
            })
        })
    })
})
