import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    vi,
    beforeEach,
} from 'vitest'
import { app } from '../app'
import { chapterStoryService } from '../services/chapter.service'
import { proposalService } from '../services/proposal.service'

beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    await app.ready()
})
afterAll(async () => {
    await app.close()
})

describe('Chapter Routes', () => {
    const validId = '00000000-0000-0000-0000-000000000001'
    const now = new Date().toISOString()
    beforeEach(() => vi.resetAllMocks())

    it('GET /:storyId/chapters возвращает пагинированные главы', async () => {
        const fake = {
            items: [
                {
                    id: validId,
                    title: 'Title',
                    content: 'Content',
                    authorId: validId,
                    storyId: validId,
                    position: 1,
                    isLastChapter: true,
                    createdAt: now,
                    updatedAt: now,
                },
            ],
            totalCount: 1,
            totalPages: 1,
            page: 1,
            pageSize: 10,
        }
        vi.spyOn(chapterStoryService, 'getChaptersPaginated').mockResolvedValue(
            fake as any
        )

        const res = await app.inject({
            method: 'GET',
            url: `/${validId}/chapters?page=1&pageSize=10`,
        })
        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toEqual(fake)
    })

    it('GET /:storyId/chapters/:chapterId/proposals возвращает пагинированные предложения', async () => {
        const fake = {
            items: [
                {
                    id: validId,
                    title: 'Prop',
                    content: 'Content',
                    authorId: validId,
                    storyId: validId,
                    parentChapterId: validId,
                    voteCount: 0,
                    hasWon: false,
                    createdAt: now,
                    updatedAt: now,
                },
            ],
            totalCount: 1,
            totalPages: 1,
            page: 2,
            pageSize: 5,
        }
        vi.spyOn(proposalService, 'getProposalsPaginated').mockResolvedValue(
            fake as any
        )

        const res = await app.inject({
            method: 'GET',
            url: `/${validId}/chapters/${validId}/proposals?page=2&pageSize=5`,
        })
        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toEqual(fake)
    })

    it('GET /:storyId/chapters/:chapterId/proposals/:proposalId возвращает предложение', async () => {
        const fake = {
            id: validId,
            title: 'Prop',
            content: 'Content',
            authorId: validId,
            storyId: validId,
            parentChapterId: validId,
            voteCount: 0,
            hasWon: false,
            createdAt: now,
            updatedAt: now,
        }
        vi.spyOn(proposalService, 'getProposalById').mockResolvedValue(fake)

        const res = await app.inject({
            method: 'GET',
            url: `/${validId}/chapters/${validId}/proposals/${validId}`,
        })
        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toEqual(fake)
    })
})
