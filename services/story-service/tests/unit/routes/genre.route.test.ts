import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    vi,
    beforeEach,
} from 'vitest'
import { app } from '../app'
import { genreService } from '../services/genre.service'

beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    await app.ready()
})

afterAll(async () => {
    await app.close()
})

describe('Genre Routes', () => {
    const validId = '00000000-0000-0000-0000-000000000001'

    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('GET /genres/ возвращает список жанров', async () => {
        const fakeGenres = [{ id: validId, name: 'Fantasy' }]
        vi.spyOn(genreService, 'getAllGenres').mockResolvedValue(fakeGenres)

        const res = await app.inject({ method: 'GET', url: '/genres/' })
        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.body)
        expect(body).toEqual({ count: 1, genres: fakeGenres })
    })
})
