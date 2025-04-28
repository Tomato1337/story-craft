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
import { storyService } from '../services/story.service'

beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    await app.ready()
})
afterAll(async () => {
    await app.close()
})

describe('Story Routes', () => {
    const validId = '00000000-0000-0000-0000-000000000001'
    const now = new Date().toISOString()
    beforeEach(() => vi.resetAllMocks())

    it('GET / возвращает пагинированный список историй', async () => {
        const fake = {
            items: [
                {
                    id: validId,
                    title: 'T1T1',
                    description: 'D1D1D1D1D1D1D1D1D1D1',
                    coverImageUrl: null,
                    authorId: validId,
                    isActive: true,
                    isPublic: false,
                    currentPhase: 'PROPOSAL',
                    viewCount: 0,
                    proposalDeadline: null,
                    votingDeadline: null,
                    createdAt: now,
                    updatedAt: now,
                    storyCollaborators: [],
                    genres: [],
                },
            ],
            totalCount: 1,
            totalPages: 1,
            page: 1,
            pageSize: 10,
        }
        vi.spyOn(storyService, 'getStoriesPaginated').mockResolvedValue(
            fake as any
        )

        const res = await app.inject({
            method: 'GET',
            url: `/?page=1&pageSize=10`,
        })
        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toEqual(fake)
    })

    it('GET /:storyId возвращает историю по ID', async () => {
        const fakeStory = {
            id: validId,
            title: 'T1T1',
            description: 'D1D1D1D1D1D1D1D1D1D1',
            coverImageUrl: null,
            authorId: validId,
            isActive: true,
            isPublic: false,
            currentPhase: 'PROPOSAL',
            viewCount: 0,
            proposalDeadline: null,
            votingDeadline: null,
            createdAt: now,
            updatedAt: now,
            storyCollaborators: [],
            genres: [],
        }
        vi.spyOn(storyService, 'getStoryById').mockResolvedValue(
            fakeStory as any
        )

        const res = await app.inject({ method: 'GET', url: `/${validId}` })
        expect(res.statusCode).toBe(200)
        expect(JSON.parse(res.body)).toEqual(fakeStory)
    })

    it('GET /:storyId возвращает 404 если не найдено', async () => {
        vi.spyOn(storyService, 'getStoryById').mockResolvedValue(null)

        const res = await app.inject({ method: 'GET', url: `/${validId}` })
        expect(res.statusCode).toBe(404)
    })

    it('POST / создаёт историю при авторизованном пользователе', async () => {
        const payload = {
            title: 'Title long enough',
            description: 'Description must be at least 10 characters long',
            genres: [validId],
            isPublic: false,
            initialChapter: { title: 'C1', content: 'Content' },
        }
        const fakeStory = {
            id: validId,
            ...payload,
            coverImageUrl: null,
            authorId: validId,
            isActive: true,
            currentPhase: 'PROPOSAL',
            viewCount: 0,
            proposalDeadline: null,
            votingDeadline: null,
            createdAt: now,
            updatedAt: now,
            storyCollaborators: [],
            genres: [],
        }
        vi.spyOn(storyService, 'createStory').mockResolvedValue(
            fakeStory as any
        )

        const res = await app.inject({
            method: 'POST',
            url: '/',
            headers: {
                'x-user-object': JSON.stringify({ userId: validId }),
                'content-type': 'application/json',
            },
            payload,
        })
        expect(res.statusCode).toBe(201)
        expect(JSON.parse(res.body)).toEqual(fakeStory)
    })

    it('POST / возвращает 401 без заголовка авторизации', async () => {
        const res = await app.inject({ method: 'POST', url: '/', payload: {} })
        expect(res.statusCode).toBe(401)
    })
})
