import { prisma } from '../prisma'
import { CreateChapterInput } from '../model/chapter.model'
import { NotFoundError } from '../utils/errors'

export const chapterStoryService = {
    async createChapter(
        storyId: string,
        data: CreateChapterInput,
        authorId: string
    ) {
        const story = await prisma.story.findUnique({
            where: { id: storyId },
        })

        if (!story) {
            throw new NotFoundError(`История с ID ${storyId} не найдена`)
        }

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

    async getChapterById(chapterId: string) {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
        })

        if (!chapter) {
            throw new NotFoundError(`Глава с ID ${chapterId} не найдена`)
        }

        return chapter
    },

    async getChaptersPaginated(
        storyId: string,
        page: number = 1,
        pageSize: number = 10
    ) {
        const story = await prisma.story.findUnique({
            where: { id: storyId },
        })

        if (!story) {
            throw new NotFoundError(`История с ID ${storyId} не найдена`)
        }

        const totalCount = await prisma.chapter.count({ where: { storyId } })
        const items = await prisma.chapter.findMany({
            where: { storyId },
            orderBy: { position: 'asc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

        const totalPages = Math.ceil(totalCount / pageSize) || 1
        return { items, totalCount, totalPages, page, pageSize }
    },
}
