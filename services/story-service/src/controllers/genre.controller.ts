import { FastifyReply, FastifyRequest } from 'fastify'
import { genreService } from '../services/genre.service'
import { GetAllGenresResponse } from '../model/genre.model'

export const genreController = {
    async getAllGenres(request: FastifyRequest, reply: FastifyReply) {
        try {
            const genres = await genreService.getAllGenres()
            const response: GetAllGenresResponse = {
                count: genres.length,
                genres: genres.map((g) => ({ id: g.id, name: g.name })),
            }
            return reply.code(200).send(response)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: 'Internal Server Error' })
        }
    },
}
