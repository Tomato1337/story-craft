import {
    FastifyPluginAsyncZod,
    ZodTypeProvider,
} from 'fastify-type-provider-zod'
import z from 'zod'
import { chapterController } from '../controllers/chapter.controller'
import {
    proposeChapterSchema,
    proposalResponseSchema,
    voteResponseSchema,
    paginatedChapterResponseSchema,
    paginatedProposalResponseSchema,
    createChapterSchema,
    chapterResponseSchema,
} from '../model/chapter.model'

export const chapterRoutes: FastifyPluginAsyncZod = async (app, options) => {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/:storyId/chapters',
        schema: {
            tags: ['Stories'],
            description: 'Get all chapters for a story',
            params: z.object({ storyId: z.string().uuid() }),
            querystring: z.object({
                page: z.coerce.number().optional(),
                pageSize: z.coerce.number().optional(),
            }),
            response: { 200: paginatedChapterResponseSchema },
        },
        handler: chapterController.getChapters,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/:storyId/chapters/:chapterId',
        schema: {
            tags: ['Stories'],
            description: 'Get chapter by ID',
            params: z.object({
                storyId: z.string().uuid(),
                chapterId: z.string().uuid(),
            }),
            response: { 200: chapterResponseSchema },
        },
        handler: chapterController.getChapterById,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/:storyId/chapters/:chapterId/proposals',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Propose a new chapter for a story',
            security: [{ bearerAuth: [] }],
            params: z.object({
                storyId: z.string().uuid(),
                chapterId: z.string().uuid(),
            }),
            body: proposeChapterSchema,
            response: { 201: proposalResponseSchema },
        },
        handler: chapterController.createProposeChapter,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'DELETE',
        url: '/:storyId/chapters/:chapterId/proposals/:proposalId',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Delete a proposal',
            security: [{ bearerAuth: [] }],
            params: z.object({
                storyId: z.string().uuid(),
                chapterId: z.string().uuid(),
                proposalId: z.string().uuid(),
            }),
            response: {
                204: z.object({
                    status: z.boolean(),
                }),
            },
        },
        handler: chapterController.deleteProposalById,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'PATCH',
        url: '/:storyId/chapters/:chapterId/proposals/:proposalId',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Change a proposal in PROPOSAL phase',
            security: [{ bearerAuth: [] }],
            params: z.object({
                storyId: z.string().uuid(),
                chapterId: z.string().uuid(),
                proposalId: z.string().uuid(),
            }),
            body: createChapterSchema,
            response: {
                204: proposalResponseSchema,
            },
        },
        handler: chapterController.changeProposalById,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/:storyId/chapters/:chapterId/proposals',
        schema: {
            tags: ['Stories'],
            description: 'Get all proposals for a chapter',
            params: z.object({
                storyId: z.string().uuid(),
                chapterId: z.string().uuid(),
            }),
            querystring: z.object({
                page: z.coerce.number().optional(),
                pageSize: z.coerce.number().optional(),
            }),
            response: { 200: paginatedProposalResponseSchema },
        },
        handler: chapterController.getProposals,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/:storyId/chapters/:chapterId/proposals/:proposalId',
        schema: {
            tags: ['Stories'],
            description: 'Get a proposal by ID',
            params: z.object({
                storyId: z.string().uuid(),
                chapterId: z.string().uuid(),
                proposalId: z.string().uuid(),
            }),
            response: { 200: proposalResponseSchema },
        },
        handler: chapterController.getProposalById,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/proposals/:proposalId/vote',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Vote for a proposal',
            security: [{ bearerAuth: [] }],
            params: z.object({ proposalId: z.string().uuid() }),
            response: { 200: voteResponseSchema },
        },
        handler: chapterController.voteProposal,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'DELETE',
        url: '/proposals/:proposalId/vote',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Remove vote for a proposal',
            security: [{ bearerAuth: [] }],
            params: z.object({ proposalId: z.string().uuid() }),
            response: { 200: voteResponseSchema },
        },
        handler: chapterController.deleteVoteProposal,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/proposals/:proposalId/select-winner',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Select a winner proposal',
            security: [{ bearerAuth: [] }],
            params: z.object({ proposalId: z.string().uuid() }),
            response: { 200: proposalResponseSchema },
        },
        handler: chapterController.selectWinnerProposal,
    })
}
