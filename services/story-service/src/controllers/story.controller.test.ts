import { describe, it, expect, vi, beforeEach } from 'vitest'
import { storyController } from './story.controller'
import { storyService } from '../services/story.service'
import { FastifyRequest, FastifyReply } from 'fastify'

vi.mock('../services/story.service', () => ({
    storyService: {
        createStory: vi.fn(),
        getStoryById: vi.fn(),
        updateStory: vi.fn(),
        getMyStoriesPaginated: vi.fn(),
        deleteStory: vi.fn(),
        getStoriesPaginated: vi.fn(),
    },
}))

describe('Story Controller', () => {
    let mockRequest: Partial<FastifyRequest>
    let mockReply: Partial<FastifyReply>

    beforeEach(() => {
        mockReply = {
            status: vi.fn().mockReturnThis(),
            code: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        }
        vi.clearAllMocks()
    })

    describe('createStory', () => {
        it('должен создавать историю и возвращать статус 201', async () => {
            const storyData = {
                title: 'Тестовая история',
                description: 'Описание тестовой истории',
                coverImageUrl: 'https://example.com/image.jpg',
                isPublic: true,
                genres: ['genre1', 'genre2'],
                initialChapter: {
                    title: 'Начальная глава',
                    content: 'Содержание начальной главы',
                },
                proposalTime: 3600000,
                votingTime: 3600000,
            }

            mockRequest = {
                body: storyData,
                user: { userId: 'user123' },
            }

            const mockStory = {
                id: 'story123',
                ...storyData,
                authorId: 'user123',
                storyCollaborators: [],
            }

            ;(storyService.createStory as any).mockResolvedValueOnce(mockStory)

            await storyController.createStory(
                mockRequest as any,
                mockReply as any
            )

            expect(storyService.createStory).toHaveBeenCalledWith(
                storyData,
                'user123'
            )
            expect(mockReply.status).toHaveBeenCalledWith(201)
            expect(mockReply.send).toHaveBeenCalledWith(mockStory)
        })
    })

    describe('getStoryById', () => {
        it('должен получать историю по идентификатору', async () => {
            const storyId = 'story123'
            mockRequest = {
                params: { storyId },
            }

            const mockStory = {
                id: storyId,
                title: 'Тестовая история',
                storyCollaborators: [],
            }

            ;(storyService.getStoryById as any).mockResolvedValueOnce(mockStory)

            await storyController.getStoryById(
                mockRequest as any,
                mockReply as any
            )

            expect(storyService.getStoryById).toHaveBeenCalledWith(storyId)
            expect(mockReply.send).toHaveBeenCalledWith(mockStory)
        })
    })

    describe('updateStoryById', () => {
        it('должен обновлять историю', async () => {
            const storyId = 'story123'
            const updateData = {
                title: 'Обновленное название',
                description: 'Обновленное описание',
                isPublic: false,
                genres: ['genre3'],
            }

            mockRequest = {
                params: { storyId },
                body: updateData,
                user: { userId: 'user123' },
            }

            const updatedStory = {
                id: storyId,
                ...updateData,
                storyCollaborators: [],
            }

            ;(storyService.updateStory as any).mockResolvedValueOnce(
                updatedStory
            )

            await storyController.updateStoryById(
                mockRequest as any,
                mockReply as any
            )

            expect(storyService.updateStory).toHaveBeenCalledWith(
                storyId,
                updateData,
                'user123'
            )
            expect(mockReply.send).toHaveBeenCalledWith(updatedStory)
        })
    })

    describe('getMyStories', () => {
        it('должен получать истории пользователя с пагинацией', async () => {
            mockRequest = {
                user: { userId: 'user123' },
                query: { page: 2, pageSize: 5 },
            }

            const mockResult = {
                items: [{ id: 'story1', title: 'История 1' }],
                totalCount: 15,
                totalPages: 3,
                page: 2,
                pageSize: 5,
            }

            ;(storyService.getMyStoriesPaginated as any).mockResolvedValueOnce(
                mockResult
            )

            await storyController.getMyStories(
                mockRequest as any,
                mockReply as any
            )

            expect(storyService.getMyStoriesPaginated).toHaveBeenCalledWith(
                'user123',
                2,
                5
            )
            expect(mockReply.send).toHaveBeenCalledWith(mockResult)
        })

        it('должен использовать стандартные значения пагинации, если они не указаны', async () => {
            mockRequest = {
                user: { userId: 'user123' },
                query: {},
            }

            const mockResult = {
                items: [{ id: 'story1', title: 'История 1' }],
                totalCount: 15,
                totalPages: 2,
                page: 1,
                pageSize: 10,
            }

            ;(storyService.getMyStoriesPaginated as any).mockResolvedValueOnce(
                mockResult
            )

            await storyController.getMyStories(
                mockRequest as any,
                mockReply as any
            )

            expect(storyService.getMyStoriesPaginated).toHaveBeenCalledWith(
                'user123',
                undefined,
                undefined
            )
            expect(mockReply.send).toHaveBeenCalledWith(mockResult)
        })
    })

    describe('deleteStoryById', () => {
        it('должен удалять историю и возвращать статус 204', async () => {
            const storyId = 'story123'
            mockRequest = {
                params: { storyId },
                user: { userId: 'user123' },
            }

            vi.mocked(storyService.deleteStory).mockResolvedValueOnce({
                success: true,
            })

            await storyController.deleteStoryById(
                mockRequest as any,
                mockReply as any
            )

            expect(storyService.deleteStory).toHaveBeenCalledWith(
                storyId,
                'user123'
            )
            expect(mockReply.status).toHaveBeenCalledWith(204)
            expect(mockReply.send).toHaveBeenCalledWith({ success: true })
        })
    })

    describe('getAllStory', () => {
        it('должен получать все истории с пагинацией', async () => {
            mockRequest = {
                user: { userId: 'user123' },
                query: { page: 2, pageSize: 5 },
            }

            const mockResult = {
                items: [{ id: 'story1', title: 'История 1' }],
                totalCount: 15,
                totalPages: 3,
                page: 2,
                pageSize: 5,
            }

            ;(storyService.getStoriesPaginated as any).mockResolvedValueOnce(
                mockResult
            )

            await storyController.getAllStory(
                mockRequest as any,
                mockReply as any
            )

            expect(storyService.getStoriesPaginated).toHaveBeenCalledWith(
                2,
                5,
                'user123'
            )
            expect(mockReply.code).toHaveBeenCalledWith(200)
            expect(mockReply.send).toHaveBeenCalledWith(mockResult)
        })

        it('должен обрабатывать случай, когда пользователь не аутентифицирован', async () => {
            mockRequest = {
                user: undefined,
                query: { page: 1, pageSize: 10 },
            }

            const mockResult = {
                items: [{ id: 'story1', title: 'История 1' }],
                totalCount: 10,
                totalPages: 1,
                page: 1,
                pageSize: 10,
            }

            ;(storyService.getStoriesPaginated as any).mockResolvedValueOnce(
                mockResult
            )

            await storyController.getAllStory(
                mockRequest as any,
                mockReply as any
            )

            expect(storyService.getStoriesPaginated).toHaveBeenCalledWith(
                1,
                10,
                undefined
            )
            expect(mockReply.code).toHaveBeenCalledWith(200)
            expect(mockReply.send).toHaveBeenCalledWith(mockResult)
        })
    })
})
