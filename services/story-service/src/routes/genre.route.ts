import {
    FastifyPluginAsyncZod,
    ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { getAllGenresResponseSchema } from '../model/genre.model'
import { genreController } from '../controllers/genre.controller'

export const genreRoutes: FastifyPluginAsyncZod = async (app, options) => {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/',
        // schema: {
        //     response: {
        //         200: getAllGenresResponseSchema,
        //     },
        // },
        handler: genreController.getAllGenres,
    })
}
