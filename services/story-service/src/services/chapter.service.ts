import { prisma } from '../prisma'
import { CreateChapterInput } from '../model/chapter.model'

export const chapterStoryService = {
    // Создать новую главу для истории
    async createChapter(
        storyId: string,
        data: CreateChapterInput,
        authorId: string
    ) {
        // Определяем позицию как текущее количество глав + 1
        const count = await prisma.chapter.count({ where: { storyId } })
        const chapter = await prisma.chapter.create({
            data: {
                title: data.title,
                content: data.content,
                authorId,
                storyId,
                position: count + 1,
                isLastChapter: true,
            },
        })
        return chapter
    },

    // Получить все главы истории в порядке
    async getChapters(storyId: string) {
        return prisma.chapter.findMany({
            where: { storyId },
            orderBy: { position: 'asc' },
        })
    },
}
