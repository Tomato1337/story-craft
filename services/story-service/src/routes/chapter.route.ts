import {
    FastifyPluginAsyncZod,
    ZodTypeProvider,
} from 'fastify-type-provider-zod'
import z from 'zod'
import { chapterController } from '../controllers/chapter.controller'
import {
    chapterResponseSchema,
    proposeChapterSchema,
    proposalResponseSchema,
    voteResponseSchema,
} from '../model/chapter.model'

export const chapterRoutes: FastifyPluginAsyncZod = async (app, options) => {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/:storyId/chapters',
        schema: {
            params: z.object({ storyId: z.string().uuid() }),
            response: { 200: z.array(chapterResponseSchema) },
        },
        handler: chapterController.getChapters,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/:storyId/chapters/:chapterId/proposals',
        preValidation: [app.authenticate],
        schema: {
            params: z.object({
                storyId: z.string().uuid(),
                chapterId: z.string().uuid(),
            }),
            body: proposeChapterSchema,
            response: { 201: proposalResponseSchema },
        },
        handler: chapterController.proposeChapter,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/:storyId/chapters/:chapterId/proposals',
        schema: {
            params: z.object({
                storyId: z.string().uuid(),
                chapterId: z.string().uuid(),
            }),
            response: { 200: z.array(proposalResponseSchema) },
        },
        handler: chapterController.getProposals,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/proposals/:proposalId/vote',
        preValidation: [app.authenticate],
        schema: {
            params: z.object({ proposalId: z.string().uuid() }),
            response: { 200: voteResponseSchema },
        },
        handler: chapterController.voteProposal,
    })
}
