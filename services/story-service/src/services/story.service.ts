import { CreateStoryInput } from '../model/story.model'
import { prisma, Role } from '../prisma'

export const storyService = {
    async createStory(data: CreateStoryInput, authorId: string) {
        const story = await prisma.story.create({
            data: {
                title: data.title,
                description: data.description,
                coverImageUrl: data.coverImageUrl,
                isPublic: data.isPublic,
                authorId,
                // создаем начальную главу
                chapters: {
                    create: {
                        title: data.initialChapter.title,
                        content: data.initialChapter.content,
                        authorId,
                        position: 1,
                        isLastChapter: true,
                    },
                },
                genres: {
                    connect: data.genres.map((genre) => ({ id: genre })),
                },
                storyCollaborators: {
                    create: {
                        userId: authorId,
                        role: Role.USER,
                    },
                },
            },
            include: {
                storyCollaborators: true,
                genres: true,
            },
        })

        return story
    },

    async getStoryById(id: string) {
        const story = await prisma.story.findUnique({
            where: { id },
            include: {
                storyCollaborators: true,
                genres: true,
            },
        })

        if (story) {
            await prisma.story.update({
                where: { id },
                data: {
                    viewCount: story.viewCount + 1,
                },
            })
        } else {
            throw new Error('Story not found')
        }

        return prisma.story.findUnique({
            where: { id },
            include: {
                storyCollaborators: true,
                genres: true,
            },
        })
    },

    async getAllStory() {
        return prisma.story.findMany({
            orderBy: {
                updatedAt: 'desc',
            },
            include: {
                storyCollaborators: true,
                genres: true,
            },
        })
    },

    async updateStory(id: string, data: Partial<CreateStoryInput>) {
        return prisma.story.update({
            where: { id },
            data: {
                ...data,
                genres: data.genres && {
                    set: [],
                    connect: data.genres.map((genre) => ({ id: genre })),
                },
            },
            include: {
                storyCollaborators: true,
                genres: true,
            },
        })
    },

    async deleteStory(id: string) {
        return prisma.story.delete({
            where: { id },
        })
    },
}
