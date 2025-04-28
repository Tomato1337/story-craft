import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storyController } from './story.controller'
import { storyService } from '../services/story.service'

describe('storyController', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('getAllStory', () => {
        it('должен возвращать пагинированный результат', async () => {
            const fakeResult = {
                items: [{ id: 's1' }],
                totalCount: 1,
                totalPages: 1,
                page: 2,
                pageSize: 5,
            }
            vi.spyOn(storyService, 'getStoriesPaginated').mockResolvedValue(
                fakeResult as any
            )

            const request = {
                query: { page: 2, pageSize: 5 },
                log: { error: vi.fn() },
            } as any
            const reply = {
                code: vi.fn().mockReturnThis(),
                send: vi.fn(),
            } as any

            await storyController.getAllStory(request, reply)

            expect(storyService.getStoriesPaginated).toHaveBeenCalledWith(2, 5)
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith(fakeResult)
        })
    })

    describe('getStoryById', () => {
        it('должен вернуть историю, если найдена', async () => {
            const fakeStory = { id: 's1' }
            vi.spyOn(storyService, 'getStoryById').mockResolvedValue(
                fakeStory as any
            )

            const request = {
                params: { id: 's1' },
                log: { error: vi.fn() },
            } as any
            const reply = {
                send: vi.fn(),
                status: vi.fn().mockReturnThis(),
            } as any

            await storyController.getStoryById(request, reply)

            expect(reply.send).toHaveBeenCalledWith(fakeStory)
        })

        it('должен вернуть 404, если история не найдена', async () => {
            vi.spyOn(storyService, 'getStoryById').mockResolvedValue(null)

            const request = {
                params: { id: 's1' },
                log: { error: vi.fn() },
            } as any
            const reply = {
                send: vi.fn(),
                status: vi.fn().mockReturnThis(),
            } as any

            await storyController.getStoryById(request, reply)

            expect(reply.status).toHaveBeenCalledWith(404)
            expect(reply.send).toHaveBeenCalledWith({
                error: 'NotFoundError',
                statusCode: 404,
            })
        })
    })
})
