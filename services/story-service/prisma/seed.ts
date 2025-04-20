import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const genres = [
    { name: 'Фэнтези' },
    { name: 'Научная фантастика' },
    { name: 'Детектив' },
    { name: 'Приключения' },
    { name: 'Романтика' },
    { name: 'Драма' },
    { name: 'Комедия' },
    { name: 'Хоррор' },
    { name: 'Историческая фантастика' },
    { name: 'Альтернативная история' },
    { name: 'Фантастика' },
    { name: 'Ужасы' },
    { name: 'Мистика' },
    { name: 'Триллер' },
    { name: 'Сказка' },
    { name: 'ЛитРПГ' },
    { name: 'Киберпанк' },
    { name: 'Постапокалипсис' },
    { name: 'Юмор' },
    { name: 'Спорт' },
    { name: 'Семейная сага' },
    { name: 'Приключенческий роман' },
    { name: 'Эротика' },
]

interface RegisterResponse {
    message: string
    user: User
    tokens: Tokens
}

interface Tokens {
    accessToken: string
    refreshToken: string
}

interface User {
    id: string
    email: string
    username: string
    role: string
}

async function main() {
    console.log(`Начинаем заполнение жанров...`)

    for (const genre of genres) {
        const existingGenre = await prisma.genre.findFirst({
            where: { name: genre.name },
        })

        if (!existingGenre) {
            await prisma.genre.create({
                data: genre,
            })
            console.log(`Создан жанр: ${genre.name}`)
        } else {
            console.log(`Жанр уже существует: ${genre.name}`)
        }
    }

    console.log(`Заполнение жанров завершено!`)

    // Создание demo истории с начальной главой
    const demoTitle = 'Demo Story 10'
    const existingStory = await prisma.story.findFirst({
        where: { title: demoTitle },
    })
    if (!existingStory) {
        const allGenres = await prisma.genre.findMany()
        let user = await fetch('http://api-gateway-dev:3000/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'demo@example.com',
                password: 'password',
                username: 'demoUser',
            }),
        })
        if (user.status !== 200) {
            user = await fetch('http://api-gateway-dev:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'demo@example.com',
                    password: 'password',
                }),
            })
        }

        const userData = (await user.json()) as RegisterResponse

        if (!userData) {
            throw new Error('Не удалось создать пользователя demoUser')
        }
        const story = await prisma.story.create({
            data: {
                title: demoTitle,
                description: 'Начальная демо-история для тестирования',
                coverImageUrl: '',
                authorId: userData.user.id,
                isPublic: true,
                genres: { connect: allGenres.map((g) => ({ id: g.id })) },
                storyCollaborators: {
                    create: { userId: userData.user.id, role: 'USER' },
                },
                chapters: {
                    create: {
                        title: 'Introduction',
                        content: 'Это первая глава демо-истории.',
                        authorId: userData.user.id,
                        position: 1,
                        isLastChapter: true,
                    },
                },
            },
        })
        console.log(`Создана демо-история с ID: ${story.id}`)
    } else {
        console.log('Демо-история уже существует')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
