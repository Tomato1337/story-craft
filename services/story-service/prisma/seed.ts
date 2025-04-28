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
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
