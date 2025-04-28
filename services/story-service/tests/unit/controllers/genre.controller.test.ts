import { describe, it, expect, beforeEach, vi } from 'vitest'
import { genreController } from './genre.controller'
import { genreService } from '../services/genre.service'

describe('genreController', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('getAllGenres возвращает количество и список жанров', async () => {
        const fakeGenres = [{ id: 'g1', name: 'Fantasy' }]
        vi.spyOn(genreService, 'getAllGenres').mockResolvedValue(
            fakeGenres as any
        )

        const request = { log: { error: vi.fn() } } as any
        const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() } as any

        await genreController.getAllGenres(request, reply)

        expect(genreService.getAllGenres).toHaveBeenCalled()
        expect(reply.code).toHaveBeenCalledWith(200)
        expect(reply.send).toHaveBeenCalledWith({
            count: 1,
            genres: fakeGenres,
        })
    })
})
