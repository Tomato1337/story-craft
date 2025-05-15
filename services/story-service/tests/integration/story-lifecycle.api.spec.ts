import { test, expect } from '@playwright/test'

const testStory = {
    title: 'Тестирование жизненного цикла истории',
    description: 'История для тестирования фаз PROPOSAL и VOTING',
    proposalTime: 3000,
    votingTime: 3000,
    initialChapter: {
        title: 'Начальная глава',
        content: 'Содержание начальной главы для тестов жизненного цикла.',
    },
}

const waitForPhaseChange = async (
    request,
    storyId,
    expectedPhase,
    maxAttempts = 10
) => {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const storyResponse = await request.get(`/${storyId}`)
        if (storyResponse.status() === 200) {
            const story = await storyResponse.json()
            if (story.currentPhase === expectedPhase) {
                return story
            }
        }
    }
    throw new Error(
        `Фаза не изменилась на ${expectedPhase} после ${maxAttempts} попыток`
    )
}

test.describe('Жизненный цикл истории: PROPOSAL -> VOTING -> Новая глава', () => {
    let storyId: string
    let chapterId: string
    const userId: string = '00000000-0000-0000-0000-000000000001'
    const secondUserId: string = '00000000-0000-0000-0000-000000000002'
    let genreId: string
    let firstProposalId: string

    test('1. Создание новой истории', async ({ request }) => {
        const genreResponse = await request.get('genres/')
        expect(genreResponse.status()).toBe(200)
        const genreBody = await genreResponse.json()
        expect(genreBody.genres.length).toBeGreaterThan(0)
        genreId = genreBody.genres[0].id

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

        expect(storyResponse.status()).toBe(201)
        const story = await storyResponse.json()
        storyId = story.id
        console.log(`Создана тестовая история с ID: ${storyId}`)

        expect(story.currentPhase).toBe('PROPOSAL')
        expect(story.proposalDeadline).toBeNull()
    })

    test('2. Получение ID последней главы истории', async ({ request }) => {
        test.skip(!storyId, 'Требуется ID истории из предыдущего шага')

        const response = await request.get(`/${storyId}/chapters`)
        expect(response.status()).toBe(200)
        const body = await response.json()

        expect(body).toHaveProperty('items')
        expect(body.items.length).toBeGreaterThan(0)
        expect(body.items[0].isLastChapter).toBe(true)

        chapterId = body.items[0].id
        console.log(`Получена последняя глава с ID: ${chapterId}`)
    })

    test('3. Создание первого предложения', async ({ request }) => {
        test.skip(!storyId || !chapterId, 'Требуется ID истории и главы')

        const proposalData = {
            title: 'Первое предложение',
            content:
                'Содержание первого предложения для проверки цикла истории',
        }

        const response = await request.post(
            `/${storyId}/chapters/${chapterId}/proposals`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-object': JSON.stringify({ userId: secondUserId }),
                },
                data: proposalData,
            }
        )

        expect(response.status()).toBe(201)
        const proposal = await response.json()
        firstProposalId = proposal.id

        const storyResponse = await request.get(`/${storyId}`)
        expect(storyResponse.status()).toBe(200)
        const story = await storyResponse.json()
        expect(story.currentPhase).toBe('PROPOSAL')
        expect(story.proposalDeadline).toBeNull()
    })

    test('4. Создание второго предложения и активация таймера PROPOSAL', async ({
        request,
    }) => {
        test.skip(!storyId || !chapterId, 'Требуется ID истории и главы')

        const proposalData = {
            title: 'Второе предложение',
            content:
                'Содержание второго предложения для проверки цикла истории',
        }

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

        const storyResponse = await request.get(`/${storyId}`)
        expect(storyResponse.status()).toBe(200)
        const story = await storyResponse.json()
        expect(story.currentPhase).toBe('PROPOSAL')
        expect(story.proposalDeadline).not.toBeNull()

        console.log(
            `Начало фазы PROPOSAL с дедлайном: ${story.proposalDeadline}`
        )
    })

    test('5. Попытка голосования в фазе PROPOSAL', async ({ request }) => {
        test.skip(!firstProposalId, 'Требуется ID предложения')

        const response = await request.post(
            `/proposals/${firstProposalId}/vote`,
            {
                headers: {
                    'x-user-object': JSON.stringify({ userId }),
                },
            }
        )

        expect(response.status()).toBe(400)
        const error = await response.json()
        expect(error.message).toContain('не фаза голосования')
    })

    test('6. Ожидание окончания фазы PROPOSAL и переход в фазу VOTING', async ({
        request,
    }) => {
        test.skip(!storyId, 'Требуется ID истории')

        console.log('Ожидание завершения фазы PROPOSAL...')
        const story = await waitForPhaseChange(request, storyId, 'VOTING')

        expect(story.currentPhase).toBe('VOTING')
        expect(story.votingDeadline).not.toBeNull()
        expect(story.proposalDeadline).toBeNull()

        console.log(`Начало фазы VOTING с дедлайном: ${story.votingDeadline}`)
    })

    test('7. Голосование в фазе VOTING', async ({ request }) => {
        test.skip(!firstProposalId, 'Требуется ID предложения')

        const response = await request.post(
            `/proposals/${firstProposalId}/vote`,
            {
                headers: {
                    'x-user-object': JSON.stringify({ userId }),
                },
            }
        )

        expect(response.status()).toBe(200)
        const result = await response.json()
        expect(result).toHaveProperty('success', true)
    })

    test('8. Ожидание окончания фазы VOTING и выбор победителя', async ({
        request,
    }) => {
        test.skip(!storyId, 'Требуется ID истории')

        console.log('Ожидание завершения фазы VOTING...')
        const story = await waitForPhaseChange(request, storyId, 'PROPOSAL')

        expect(story.currentPhase).toBe('PROPOSAL')
        expect(story.votingDeadline).toBeNull()
    })

    test('9. Проверка создания новой главы после выбора победителя', async ({
        request,
    }) => {
        test.skip(!storyId, 'Требуется ID истории')

        const response = await request.get(`/${storyId}/chapters`)
        const responseStory = await request.get(`/${storyId}`)
        expect(response.status()).toBe(200)
        expect(responseStory.status()).toBe(200)
        const body = await response.json()
        const story = await responseStory.json()

        expect(story.storyCollaborators).toHaveLength(2)
        expect(story.storyCollaborators[0].userId).toBe(userId)
        expect(story.storyCollaborators[0].role).toBe('ADMIN')
        expect(story.storyCollaborators[1].userId).toBe(secondUserId)
        expect(story.storyCollaborators[1].role).toBe('USER')

        expect(body).toHaveProperty('items')
        expect(body.items.length).toBeGreaterThan(1)

        const lastChapter = body.items.find(
            (chapter) => chapter.isLastChapter === true
        )
        expect(lastChapter).toBeDefined()
        expect(lastChapter.title).toContain('Первое предложение')
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
