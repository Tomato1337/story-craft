import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import {
    FastifyPluginAsyncZod,
    ZodTypeProvider,
} from 'fastify-type-provider-zod'
import z from 'zod'
import { env } from '../config'
import { storyRoutes } from './story.route'
import { genreRoutes } from './genre.route'
import { chapterRoutes } from './chapter.route'

export const routes: FastifyPluginAsyncZod = async (app, options) => {
    app.register(storyRoutes)
    app.register(chapterRoutes)
    app.register(genreRoutes, { prefix: '/genres' })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/health',
        schema: {
            response: {
                201: z.object({
                    status: z.string(),
                    timestamp: z.date(),
                    environment: z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            return {
                status: 'ok',
                timestamp: new Date(),
                environment: env.NODE_ENV,
            }
        },
    })

    app.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: `Route ${request.method}:${request.url} not found`,
        })
    })
}
