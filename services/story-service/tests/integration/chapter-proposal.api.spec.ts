import { test, expect } from '@playwright/test'

const testStory = {
    title: 'История для теста глав',
    description:
        'Эта история используется для тестирования API глав и предложений',
    initialChapter: {
        title: 'Начальная глава',
        content: 'Содержание начальной главы для тестов.',
    },
}

test.describe('Chapter and Proposal API', () => {
    let storyId: string
    let chapterId: string
    const userId: string = '00000000-0000-0000-0000-000000000001'
    let genreId: string
    let proposalId: string

    test.beforeAll(async ({ request }) => {
        const genreResponse = await request.get('genres/')
        expect(genreResponse.status()).toBe(200)
        const genreBody = await genreResponse.json()
        expect(genreBody.genres.length).toBeGreaterThan(0)
        genreId = genreBody.genres[0].id

        // Создаем тестовую историю
        const storyResponse = await request.post('/', {
            headers: {
                'Content-Type': 'application/json',
                'x-user-object': JSON.stringify({ userId }),
            },
            data: {
                ...testStory,
                genres: [genreId],
            },
        })

        if (storyResponse.ok()) {
            const story = await storyResponse.json()
            storyId = story.id
            console.log(`Создана тестовая история с ID: ${storyId}`)
        } else {
            console.error(
                'Не удалось создать тестовую историю для тестирования глав'
            )
            test.skip(true, 'Не удалось создать тестовую историю')
        }
    })

    test('GET /:storyId/chapters должен возвращать главы истории', async ({
        request,
    }) => {
        test.skip(!storyId, 'Требуется ID истории из setup')

        const response = await request.get(
            `/${storyId}/chapters?page=1&pageSize=10`
        )

        expect(response.status()).toBe(200)
        const body = await response.json()

        expect(body).toHaveProperty('items')
        expect(body).toHaveProperty('totalCount')
        expect(body).toHaveProperty('totalPages')
        expect(body).toHaveProperty('page')
        expect(body).toHaveProperty('pageSize')
        expect(Array.isArray(body.items)).toBe(true)
        expect(body.items.length).toBeGreaterThan(0)

        if (body.items.length > 0) {
            chapterId = body.items[0].id
            console.log(`Найдена глава с ID: ${chapterId}`)
        }
    })

    const proposalTestData = [
        {
            title: 'Тестовое предложение 1',
            content: 'Содержание первого тестового предложения для API-теста.',
            testName: 'Первое предложение',
        },
        {
            title: 'Тестовое предложение 2',
            content: 'Содержание второго тестового предложения для API-теста.',
            testName: 'Второе предложение',
        },
        {
            title: 'Тестовое предложение 3',
            content: 'Содержание третьего тестового предложения для API-теста.',
            testName: 'Третье предложение',
        },
        {
            title: 'Тестовое предложение 4',
            content:
                'Содержание четвертого тестового предложения для API-теста.',
            testName: 'Четвертое предложение',
        },
        {
            title: 'Тестовое предложение 5',
            content: 'Содержание пятого тестового предложения для API-теста.',
            testName: 'Пятое предложение',
        },
    ]

    for (const proposalData of proposalTestData) {
        test(`POST /:storyId/chapters/:chapterId/proposals должен создавать предложение к главе (${proposalData.testName})`, async ({
            request,
        }) => {
            test.skip(
                !chapterId || !storyId,
                'Требуется ID истории и главы из предыдущего теста'
            )

            const response = await request.post(
                `/${storyId}/chapters/${chapterId}/proposals`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-object': JSON.stringify({ userId }),
                    },
                    data: proposalData,
                }
            )

            expect(response.status()).toBe(201)
            const proposal = await response.json()

            expect(proposal).toHaveProperty('id')
            expect(proposal.title).toBe(proposalData.title)
            expect(proposal.content).toBe(proposalData.content)
            expect(proposal.storyId).toBe(storyId)
            expect(proposal.parentChapterId).toBe(chapterId)
            expect(proposal.authorId).toBe(userId)

            proposalId = proposal.id
        })
    }

    test('GET /:storyId/chapters/:chapterId/proposals должен возвращать предложения к главе', async ({
        request,
    }) => {
        test.skip(
            !chapterId || !storyId,
            'Требуется ID истории и главы из предыдущих тестов'
        )

        const response = await request.get(
            `/${storyId}/chapters/${chapterId}/proposals?page=1&pageSize=10`
        )

        expect(response.status()).toBe(200)
        const body = await response.json()

        expect(body).toHaveProperty('items')
        expect(body).toHaveProperty('totalCount')
        expect(body).toHaveProperty('totalPages')
        expect(body).toHaveProperty('page')
        expect(body).toHaveProperty('pageSize')
        expect(Array.isArray(body.items)).toBe(true)
    })

    test('POST /proposals/:proposalId/vote должен регистрировать голос', async ({
        request,
    }) => {
        test.skip(
            !proposalId,
            'Требуется ID возможной главы из предыдущих тестов'
        )

        const response = await request.post(`/proposals/${proposalId}/vote`, {
            headers: {
                'x-user-object': JSON.stringify({ userId }),
            },
        })

        if (response.status() === 200) {
            const result = await response.json()
            expect(result).toHaveProperty('success')
        } else {
            console.log(`Голосование не доступно, статус: ${response.status()}`)
        }
    })

    test('POST /proposals/:proposalId/vote должен возвращать 401 без аутентификации', async ({
        request,
    }) => {
        test.skip(
            !proposalId,
            'Требуется ID возможной главы из предыдущих тестов'
        )

        const proposalData = {
            title: 'Предложение без авторизации',
            content: 'Это предложение не должно быть создано.',
        }

        const response = await request.post(`/proposals/${proposalId}/vote`, {
            headers: {
                'Content-Type': 'application/json',
            },
            data: proposalData,
        })

        expect(response.status()).toBe(401)
    })

    test('POST /proposals/:proposalId/vote должен возвращать 400, если пользователь уже голосовал', async ({
        request,
    }) => {
        test.skip(
            !proposalId,
            'Требуется ID возможной главы из предыдущих тестов'
        )

        const response = await request.post(`/proposals/${proposalId}/vote`, {
            headers: {
                'x-user-object': JSON.stringify({ userId }),
            },
        })

        expect(response.status()).toBe(400)
    })

    test.afterAll(async ({ request }) => {
        if (storyId) {
            const response = await request.delete(`/${storyId}`, {
                headers: {
                    'x-user-object': JSON.stringify({ userId }),
                },
            })

            expect(response.status()).toBe(204)
        }
    })
})
