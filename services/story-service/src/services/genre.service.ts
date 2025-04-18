import { CreateGenreInput } from '../model/genre'
import { prisma } from '../prisma'

export const genreService = {
    async createGenre(data: CreateGenreInput) {
        return prisma.genre.create({
            data,
        })
    },

    async getGenreById(id: string) {
        return prisma.genre.findUnique({
            where: { id },
        })
    },

    async updateGenre(id: string, data: Partial<CreateGenreInput>) {
        return prisma.genre.update({
            where: { id },
            data,
        })
    },

    async deleteGenre(id: string) {
        return prisma.genre.delete({
            where: { id },
        })
    },

    async getAllGenres() {
        return prisma.genre.findMany()
    },
}
