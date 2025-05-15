import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chapterRoutes } from './chapter.route'
import { chapterController } from '../controllers/chapter.controller'
import z from 'zod'

const mockFastifyApp = {
    route: vi.fn(),
    authenticate: 'authenticateMiddleware',
    withTypeProvider: vi.fn().mockReturnThis(),
}

vi.mock('../controllers/chapter.controller', () => ({
    chapterController: {
        getChapters: 'getChaptersHandler',
        getChapterById: 'getChapterByIdHandler',
        createProposeChapter: 'createProposeChapterHandler',
        deleteProposalById: 'deleteProposalByIdHandler',
        changeProposalById: 'changeProposalByIdHandler',
        getProposals: 'getProposalsHandler',
        getProposalById: 'getProposalByIdHandler',
        voteProposal: 'voteProposalHandler',
        deleteVoteProposal: 'deleteVoteProposalHandler',
        selectWinnerProposal: 'selectWinnerProposalHandler',
    },
}))

vi.mock('../model/chapter.model', () => ({
    proposeChapterSchema: 'proposeChapterSchema',
    proposalResponseSchema: 'proposalResponseSchema',
    voteResponseSchema: 'voteResponseSchema',
    paginatedChapterResponseSchema: 'paginatedChapterResponseSchema',
    paginatedProposalResponseSchema: 'paginatedProposalResponseSchema',
    createChapterSchema: 'createChapterSchema',
    chapterResponseSchema: 'chapterResponseSchema',
}))

describe('Chapter Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('должен зарегистрировать все маршруты для глав', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        expect(mockFastifyApp.route).toHaveBeenCalledTimes(10)
        expect(mockFastifyApp.withTypeProvider).toHaveBeenCalledTimes(10)
    })

    it('должен правильно зарегистрировать маршрут GET /:storyId/chapters', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const getChaptersRoute = mockFastifyApp.route.mock.calls[0][0]
        expect(getChaptersRoute).toMatchObject({
            method: 'GET',
            url: '/:storyId/chapters',
            handler: chapterController.getChapters,
        })

        expect(getChaptersRoute.schema.tags).toContain('Stories')
        expect(getChaptersRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(getChaptersRoute.schema.querystring).toBeInstanceOf(z.ZodObject)
        expect(getChaptersRoute.schema.response[200]).toBe(
            'paginatedChapterResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут GET /:storyId/chapters/:chapterId', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const getChapterByIdRoute = mockFastifyApp.route.mock.calls[1][0]
        expect(getChapterByIdRoute).toMatchObject({
            method: 'GET',
            url: '/:storyId/chapters/:chapterId',
            handler: chapterController.getChapterById,
        })

        expect(getChapterByIdRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(getChapterByIdRoute.schema.response[200]).toBe(
            'chapterResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут POST /:storyId/chapters/:chapterId/proposals', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const createProposeChapterRoute = mockFastifyApp.route.mock.calls[2][0]
        expect(createProposeChapterRoute).toMatchObject({
            method: 'POST',
            url: '/:storyId/chapters/:chapterId/proposals',
            preValidation: [mockFastifyApp.authenticate],
            handler: chapterController.createProposeChapter,
        })

        expect(createProposeChapterRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(createProposeChapterRoute.schema.params).toBeInstanceOf(
            z.ZodObject
        )
        expect(createProposeChapterRoute.schema.body).toBe(
            'proposeChapterSchema'
        )
        expect(createProposeChapterRoute.schema.response[201]).toBe(
            'proposalResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут DELETE /:storyId/chapters/:chapterId/proposals/:proposalId', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const deleteProposalRoute = mockFastifyApp.route.mock.calls[3][0]
        expect(deleteProposalRoute).toMatchObject({
            method: 'DELETE',
            url: '/:storyId/chapters/:chapterId/proposals/:proposalId',
            preValidation: [mockFastifyApp.authenticate],
            handler: chapterController.deleteProposalById,
        })

        expect(deleteProposalRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(deleteProposalRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(deleteProposalRoute.schema.response[204].shape).toHaveProperty(
            'status'
        )
    })

    it('должен правильно зарегистрировать маршрут PATCH /:storyId/chapters/:chapterId/proposals/:proposalId', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const changeProposalRoute = mockFastifyApp.route.mock.calls[4][0]
        expect(changeProposalRoute).toMatchObject({
            method: 'PATCH',
            url: '/:storyId/chapters/:chapterId/proposals/:proposalId',
            preValidation: [mockFastifyApp.authenticate],
            handler: chapterController.changeProposalById,
        })

        expect(changeProposalRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(changeProposalRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(changeProposalRoute.schema.body).toBe('createChapterSchema')
        expect(changeProposalRoute.schema.response[204]).toBe(
            'proposalResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут GET /:storyId/chapters/:chapterId/proposals', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const getProposalsRoute = mockFastifyApp.route.mock.calls[5][0]
        expect(getProposalsRoute).toMatchObject({
            method: 'GET',
            url: '/:storyId/chapters/:chapterId/proposals',
            handler: chapterController.getProposals,
        })

        expect(getProposalsRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(getProposalsRoute.schema.querystring).toBeInstanceOf(z.ZodObject)
        expect(getProposalsRoute.schema.response[200]).toBe(
            'paginatedProposalResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут GET /:storyId/chapters/:chapterId/proposals/:proposalId', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const getProposalByIdRoute = mockFastifyApp.route.mock.calls[6][0]
        expect(getProposalByIdRoute).toMatchObject({
            method: 'GET',
            url: '/:storyId/chapters/:chapterId/proposals/:proposalId',
            handler: chapterController.getProposalById,
        })

        expect(getProposalByIdRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(getProposalByIdRoute.schema.response[200]).toBe(
            'proposalResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут POST /proposals/:proposalId/vote', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const voteProposalRoute = mockFastifyApp.route.mock.calls[7][0]
        expect(voteProposalRoute).toMatchObject({
            method: 'POST',
            url: '/proposals/:proposalId/vote',
            preValidation: [mockFastifyApp.authenticate],
            handler: chapterController.voteProposal,
        })

        expect(voteProposalRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(voteProposalRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(voteProposalRoute.schema.response[200]).toBe(
            'voteResponseSchema'
        )
    })

    it('должен правильно зарегистрировать маршрут DELETE /proposals/:proposalId/vote', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const deleteVoteRoute = mockFastifyApp.route.mock.calls[8][0]
        expect(deleteVoteRoute).toMatchObject({
            method: 'DELETE',
            url: '/proposals/:proposalId/vote',
            preValidation: [mockFastifyApp.authenticate],
            handler: chapterController.deleteVoteProposal,
        })

        expect(deleteVoteRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(deleteVoteRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(deleteVoteRoute.schema.response[200]).toBe('voteResponseSchema')
    })

    it('должен правильно зарегистрировать маршрут POST /proposals/:proposalId/select-winner', async () => {
        await chapterRoutes(mockFastifyApp as any, {} as any)

        const selectWinnerRoute = mockFastifyApp.route.mock.calls[9][0]
        expect(selectWinnerRoute).toMatchObject({
            method: 'POST',
            url: '/proposals/:proposalId/select-winner',
            preValidation: [mockFastifyApp.authenticate],
            handler: chapterController.selectWinnerProposal,
        })

        expect(selectWinnerRoute.schema.security).toContainEqual({
            bearerAuth: [],
        })
        expect(selectWinnerRoute.schema.params).toBeInstanceOf(z.ZodObject)
        expect(selectWinnerRoute.schema.response[200]).toBe(
            'proposalResponseSchema'
        )
    })
})
