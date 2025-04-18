import { FastifyReply, FastifyRequest } from 'fastify'
import { genreService } from '../services/genre.service'

export const genreController = {
    async getAllGenres(request: FastifyRequest, reply: FastifyReply) {
        try {
            const genres = await genreService.getAllGenres()
            const response = {
                count: genres.length,
                genres,
            }
            return reply.send(response)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: 'Internal Server Error' })
        }
    },
}
