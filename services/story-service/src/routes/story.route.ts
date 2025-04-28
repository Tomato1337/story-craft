import {
    FastifyPluginAsyncZod,
    ZodTypeProvider,
} from 'fastify-type-provider-zod'
import {
    createStorySchema,
    paginatedStoryResponseSchema,
    storyResponseSchema,
    updateStorySchema,
} from '../model/story.model'
import { storyController } from '../controllers/story.controller'
import z from 'zod'

export const storyRoutes: FastifyPluginAsyncZod = async (app, options) => {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/',
        preValidation: [app.authenticateOptional],
        schema: {
            tags: ['Stories'],
            description: 'Get all stories',
            querystring: z.object({
                page: z.coerce.number().optional(),
                pageSize: z.coerce.number().optional(),
            }),
            response: {
                200: paginatedStoryResponseSchema,
            },
        },
        handler: storyController.getAllStory,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/my',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Get my stories',
            security: [{ bearerAuth: [] }],
            querystring: z.object({
                page: z.coerce.number().optional(),
                pageSize: z.coerce.number().optional(),
            }),
            response: {
                200: paginatedStoryResponseSchema,
            },
        },
        handler: storyController.getMyStories,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Create a new story',
            security: [{ bearerAuth: [] }],
            body: createStorySchema,
            response: {
                200: storyResponseSchema,
            },
        },
        handler: storyController.createStory,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/:storyId',
        schema: {
            tags: ['Stories'],
            description: 'Get story by ID',
            params: z.object({ storyId: z.string().uuid() }),
            response: {
                200: storyResponseSchema,
            },
        },
        handler: storyController.getStoryById,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'PATCH',
        url: '/:storyId',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Update a story',
            security: [{ bearerAuth: [] }],
            params: z.object({ storyId: z.string().uuid() }),
            body: updateStorySchema,
            response: {
                200: storyResponseSchema,
            },
        },
        handler: storyController.updateStoryById,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'DELETE',
        url: '/:storyId',
        preValidation: [app.authenticate],
        schema: {
            tags: ['Stories'],
            description: 'Delete a story',
            security: [{ bearerAuth: [] }],
            params: z.object({ storyId: z.string().uuid() }),
            response: {
                204: z.object({
                    success: z.boolean(),
                }),
            },
        },
        handler: storyController.deleteStoryById,
    })
}
