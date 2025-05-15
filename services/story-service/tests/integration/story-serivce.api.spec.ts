import { test, expect } from '@playwright/test'

const testStory = {
    title: 'Интеграционный тест истории',
    description:
        'Это история создана автоматическим интеграционным тестом Playwright',
    initialChapter: {
        title: 'Первая глава',
        content: 'Содержание первой главы, созданной тестом.',
    },
}

test.describe('Story Service API', () => {
    let createdStoryId: string
    const userId: string = '00000000-0000-0000-0000-000000000001'
    let genreId: string

    test('GET /genres/ должен возвращать список жанров', async ({
        request,
    }) => {
        const response = await request.get('/genres/')

        expect(response.status()).toBe(200)
        const body = await response.json()

        expect(body).toHaveProperty('count')
        expect(body).toHaveProperty('genres')
        expect(Array.isArray(body.genres)).toBe(true)
        expect(body.genres.length).toBeGreaterThan(0)
        expect(body.genres[0]).toHaveProperty('id')
        expect(body.genres[0]).toHaveProperty('name')

        genreId = body.genres[0].id
    })

    test('GET / должен возвращать пагинированный список историй', async ({
        request,
    }) => {
        const response = await request.get('/?page=1&pageSize=10')

        expect(response.status()).toBe(200)
        const body = await response.json()

        expect(body).toHaveProperty('items')
        expect(body).toHaveProperty('totalCount')
        expect(body).toHaveProperty('totalPages')
        expect(body).toHaveProperty('page')
        expect(body).toHaveProperty('pageSize')
        expect(Array.isArray(body.items)).toBe(true)
    })

    test('POST / должен создавать новую историю, если пользователь аутентифицирован', async ({
        request,
    }) => {
        const response = await request.post('/', {
            headers: {
                'x-user-object': JSON.stringify({ userId }),
                'Content-Type': 'application/json',
            },
            data: {
                ...testStory,
                genres: [genreId],
            },
        })

        expect(response.status()).toBe(201)
        const story = await response.json()

        expect(story).toHaveProperty('id')
        expect(story.title).toBe(testStory.title)
        expect(story.description).toBe(testStory.description)
        expect(story.authorId).toBe(userId)

        createdStoryId = story.id
    })

    test('GET /:id должен возвращать историю по ID', async ({ request }) => {
        test.skip(
            !createdStoryId,
            'Требуется ID, созданный в тесте создания истории'
        )

        const response = await request.get(`/${createdStoryId}`)

        expect(response.status()).toBe(200)
        const story = await response.json()

        expect(story).toHaveProperty('id')
        expect(story.id).toBe(createdStoryId)
        expect(story.title).toBe(testStory.title)
        expect(story.description).toBe(testStory.description)
    })

    test('POST / должен возвращать 401 без заголовка аутентификации', async ({
        request,
    }) => {
        const response = await request.post('/', {
            headers: {
                'Content-Type': 'application/json',
            },
            data: testStory,
        })

        expect(response.status()).toBe(401)
    })

    test('POST / должен возвращать 400 при некорректных данных', async ({
        request,
    }) => {
        const invalidStory = {
            title: 'Т', // менее 3 символов
            description: 'Короткое', // менее 10 символов
            genres: [], // пустой массив
            isPublic: true,
            initialChapter: {
                title: '', // пустая строка
                content: 'Содержание',
            },
        }

        const response = await request.post('/', {
            headers: {
                'Content-Type': 'application/json',
                'x-user-object': JSON.stringify({ userId }),
            },
            data: invalidStory,
        })

        expect(response.status()).toBe(400)
    })

    test.afterAll(async ({ request }) => {
        if (createdStoryId) {
            const response = await request.delete(`/${createdStoryId}`, {
                headers: {
                    'x-user-object': JSON.stringify({ userId }),
                },
            })
            expect(response.status()).toBe(204)
        }
    })
})
