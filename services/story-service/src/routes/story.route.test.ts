import { describe, it, expect, vi, beforeEach } from 'vitest'
import { storyRoutes } from './story.route'
import { storyController } from '../controllers/story.controller'
import z from 'zod'

const mockFastifyApp = {
    route: vi.fn(),
    authenticate: 'authenticateMiddleware',
    authenticateOptional: 'authenticateOptionalMiddleware',
    withTypeProvider: vi.fn().mockReturnThis(),
}

vi.mock('../controllers/story.controller', () => ({
    storyController: {
        getAllStory: 'getAllStoryHandler',
        getMyStories: 'getMyStoriesHandler',
        createStory: 'createStoryHandler',
        getStoryById: 'getStoryByIdHandler',
        updateStoryById: 'updateStoryByIdHandler',
        deleteStoryById: 'deleteStoryByIdHandler',
    },
}))

vi.mock('../model/story.model', () => ({
    createStorySchema: 'createStorySchema',
    paginatedStoryResponseSchema: 'paginatedStoryResponseSchema',
    storyResponseSchema: 'storyResponseSchema',
    updateStorySchema: 'updateStorySchema',
}))

describe('Story Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('должен зарегистрировать все маршруты для историй', async () => {
        await storyRoutes(mockFastifyApp as any, {} as any)

        expect(mockFastifyApp.route).toHaveBeenCalledTimes(6)
        expect(mockFastifyApp.withTypeProvider).toHaveBeenCalledTimes(6)
    })

    it('должен правильно зарегистрировать маршрут GET / для всех историй', async () => {
        await storyRoutes(mockFastifyApp as any, {} as any)

        const getAllStoriesRoute = mockFastifyApp.route.mock.calls[0][0]
        expect(getAllStoriesRoute).toMatchObject({
            method: 'GET',
            url: '/',
            preValidation: [mockFastifyApp.authenticateOptional],
            handler: storyController.getAllStory,
        })

        expect(getAllStoriesRoute.schema.tags).toContain('Stories')
        expect(getAllStoriesRoute.schema.querystring).toBeInstanceOf(
            z.ZodObject
        )
        expect(getAllStoriesRoute.schema.response[200]).toBe(
            'paginatedStoryResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут GET /my для пользовательских историй', async () => {
        await storyRoutes(mockFastifyApp as any, {} as any)

        const getMyStoriesRoute = mockFastifyApp.route.mock.calls[1][0]
        expect(getMyStoriesRoute).toMatchObject({
            method: 'GET',
            url: '/my',
            preValidation: [mockFastifyApp.authenticate],
            handler: storyController.getMyStories,
        })

        expect(getMyStoriesRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(getMyStoriesRoute.schema.response[200]).toBe(
            'paginatedStoryResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут POST / для создания истории', async () => {
        await storyRoutes(mockFastifyApp as any, {} as any)

        const createStoryRoute = mockFastifyApp.route.mock.calls[2][0]
        expect(createStoryRoute).toMatchObject({
            method: 'POST',
            url: '/',
            preValidation: [mockFastifyApp.authenticate],
            handler: storyController.createStory,
        })

        expect(createStoryRoute.schema.body).toBe('createStorySchema')
        expect(createStoryRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(createStoryRoute.schema.response[200]).toBe(
            'storyResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут GET /:storyId для получения истории по ID', async () => {
        await storyRoutes(mockFastifyApp as any, {} as any)

        const getStoryByIdRoute = mockFastifyApp.route.mock.calls[3][0]
        expect(getStoryByIdRoute).toMatchObject({
            method: 'GET',
            url: '/:storyId',
            handler: storyController.getStoryById,
        })

        expect(getStoryByIdRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(getStoryByIdRoute.schema.response[200]).toBe(
            'storyResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут PATCH /:storyId для обновления истории', async () => {
        await storyRoutes(mockFastifyApp as any, {} as any)

        const updateStoryRoute = mockFastifyApp.route.mock.calls[4][0]
        expect(updateStoryRoute).toMatchObject({
            method: 'PATCH',
            url: '/:storyId',
            preValidation: [mockFastifyApp.authenticate],
            handler: storyController.updateStoryById,
        })

        expect(updateStoryRoute.schema.body).toBe('updateStorySchema')
        expect(updateStoryRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(updateStoryRoute.schema.response[200]).toBe(
            'storyResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут DELETE /:storyId для удаления истории', async () => {
        await storyRoutes(mockFastifyApp as any, {} as any)

        const deleteStoryRoute = mockFastifyApp.route.mock.calls[5][0]
        expect(deleteStoryRoute).toMatchObject({
            method: 'DELETE',
            url: '/:storyId',
            preValidation: [mockFastifyApp.authenticate],
            handler: storyController.deleteStoryById,
        })

        expect(deleteStoryRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(deleteStoryRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(deleteStoryRoute.schema.response[204].shape).toHaveProperty(
            'success'
        )
    })
})
