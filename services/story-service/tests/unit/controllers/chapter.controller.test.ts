import { describe, it, expect, beforeEach, vi } from 'vitest'
import { chapterController } from './chapter.controller'
import { chapterStoryService } from '../services/chapter.service'
import { proposalService } from '../services/proposal.service'

describe('chapterController', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('getChapters возвращает данные пагинации', async () => {
        const fake = {
            items: [{ id: 'c1' }],
            totalCount: 1,
            totalPages: 1,
            page: 1,
            pageSize: 10,
        }
        vi.spyOn(chapterStoryService, 'getChaptersPaginated').mockResolvedValue(
            fake as any
        )

        const req = {
            params: { storyId: 's1' },
            query: { page: 1, pageSize: 10 },
        } as any
        const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() } as any

        await chapterController.getChapters(req, reply)

        expect(chapterStoryService.getChaptersPaginated).toHaveBeenCalledWith(
            's1',
            1,
            10
        )
        expect(reply.code).toHaveBeenCalledWith(200)
        expect(reply.send).toHaveBeenCalledWith(fake)
    })

    it('getProposals возвращает данные пагинации', async () => {
        const fake = {
            items: [{ id: 'p1' }],
            totalCount: 1,
            totalPages: 1,
            page: 2,
            pageSize: 5,
        }
        vi.spyOn(proposalService, 'getProposalsPaginated').mockResolvedValue(
            fake as any
        )

        const req = {
            params: { storyId: 's1', chapterId: 'c1' },
            query: { page: 2, pageSize: 5 },
        } as any
        const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() } as any

        await chapterController.getProposals(req, reply)

        expect(proposalService.getProposalsPaginated).toHaveBeenCalledWith(
            's1',
            'c1',
            2,
            5
        )
        expect(reply.code).toHaveBeenCalledWith(200)
        expect(reply.send).toHaveBeenCalledWith(fake)
    })
})
