import {
    FastifyPluginAsyncZod,
    ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { createStorySchema, storyResponseSchema } from '../model/story.model'
import { storyController } from '../controllers/story.controller'
import z from 'zod'

export const storyRoutes: FastifyPluginAsyncZod = async (app, options) => {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/',
        // schema: {
        //     response: {
        //         200: storyResponseSchema,
        //     },
        // },
        handler: storyController.getAllStory,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/',
        preValidation: [app.authenticate],
        schema: {
            body: createStorySchema,
            // response: {
            //     200: storyResponseSchema,
            // },
        },
        handler: storyController.createStory,
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: z.object({ id: z.string().uuid() }),
            // response: {
            //     200: storyResponseSchema,
            // },
        },
        handler: storyController.getStoryById,
    })
}
