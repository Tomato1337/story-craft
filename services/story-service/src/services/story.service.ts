import { Prisma } from '@prisma/client'
import { ChangeStoryInput, CreateStoryInput } from '../model/story.model'
import { prisma, Role } from '../prisma'
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors'
import { TimerService } from './time.service'
import { proposalService } from './proposal.service'

export const storyService = {
    async createStory(data: CreateStoryInput, authorId: string) {
        try {
            const story = await prisma.story.create({
                data: {
                    title: data.title,
                    description: data.description,
                    coverImageUrl: data.coverImageUrl,
                    isPublic: data.isPublic ?? true,
                    proposalTime: data.proposalTime,
                    votingTime: data.votingTime,
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
                        connect: data.genres.map((genre) => ({
                            id: genre,
                        })),
                    },
                    storyCollaborators: {
                        create: {
                            userId: authorId,
                            role: Role.ADMIN,
                        },
                    },
                },
                include: {
                    storyCollaborators: true,
                    genres: true,
                },
            })

            return {
                ...story,
                storyCollaborators: story.storyCollaborators.map(
                    (collaborator) => ({
                        id: collaborator.id,
                        userId: collaborator.userId,
                        role: collaborator.role,
                    })
                ),
            }
        } catch (error) {
            if (error.code === 'P2025') {
                throw new BadRequestError(
                    'Один или несколько указанных жанров не существуют'
                )
            }
            if (error.code === 'P2003') {
                throw new BadRequestError('Указан несуществующий автор')
            }
            throw error
        }
    },

    async getStoryById(id: string, userId?: string) {
        const story = await prisma.story.findUnique({
            where: { id },
            include: {
                storyCollaborators: true,
                genres: true,
            },
        })

        if (!story?.isPublic && story?.authorId !== userId) {
            throw new ForbiddenError(
                'У вас нет прав для просмотра этой истории'
            )
        }

        let result
        if (story) {
            result = await prisma.story.update({
                where: { id },
                data: {
                    viewCount: story.viewCount + 1,
                },
                include: {
                    storyCollaborators: true,
                    genres: true,
                },
            })
        } else {
            throw new NotFoundError(`Story not found by ${id}`)
        }

        if (!result) return null

        return result
    },

    async getMyStoriesPaginated(
        userId: string,
        page: number = 1,
        pageSize: number = 10
    ) {
        const totalCount = await prisma.story.count({
            where: {
                storyCollaborators: {
                    some: {
                        userId,
                    },
                },
            },
        })

        const items = await prisma.story.findMany({
            where: {
                storyCollaborators: {
                    some: {
                        userId,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: { storyCollaborators: true, genres: true },
        })

        const totalPages = Math.ceil(totalCount / pageSize) || 1
        return { items, totalCount, totalPages, page, pageSize }
    },

    async updateStory(
        id: string,
        // Добавляем proposalDeadline в тип данных, чтобы пользователь не смог его указать, но при этом правильно работала типизация
        data: Partial<ChangeStoryInput> & {
            proposalDeadline?: Date
            votingDeadline?: Date
        },
        userId: string
    ) {
        const story = await prisma.story.findUnique({
            where: { id },
            include: {
                storyCollaborators: true,
                genres: true,
            },
        })

        if (!story) {
            throw new NotFoundError(`Story not found by ${id}`)
        }

        const userRole = story.storyCollaborators.find(
            (c) => c.userId === userId
        )?.role

        if (!userRole || userRole !== 'ADMIN') {
            throw new ForbiddenError(
                'У вас нет прав для изменения этой истории'
            )
        }

        if (
            data.proposalTime !== undefined &&
            story.proposalTime !== data.proposalTime &&
            story.currentPhase === 'PROPOSAL' &&
            story.proposalDeadline
        ) {
            TimerService.clearProposalTimer(id)

            const now = new Date()
            const deadline = story.proposalDeadline
            const elapsedTime =
                now.getTime() - (deadline.getTime() - story.proposalTime)
            const remainingTime = Math.max(
                data.proposalTime - elapsedTime,
                1000
            )

            const newDeadline = new Date(now.getTime() + remainingTime)
            data['proposalDeadline'] = newDeadline

            TimerService.setProposalTimer(id, remainingTime, () =>
                proposalService.endProposals(id)
            )
        }

        if (
            data.votingTime !== undefined &&
            story.votingTime !== data.votingTime &&
            story.currentPhase === 'VOTING' &&
            story.votingDeadline
        ) {
            TimerService.clearVotingTimer(id)

            const now = new Date()
            const deadline = story.votingDeadline
            const elapsedTime =
                now.getTime() - (deadline.getTime() - story.votingTime)
            const remainingTime = Math.max(data.votingTime - elapsedTime, 1000)

            const newDeadline = new Date(now.getTime() + remainingTime)
            data['votingDeadline'] = newDeadline

            TimerService.setVotingTimer(id, remainingTime, () =>
                proposalService.endVoting(id)
            )
        }

        try {
            const updateStory = await prisma.story.update({
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

            return updateStory
        } catch (error) {
            if (error.code === 'P2025') {
                throw new BadRequestError(
                    'Один или несколько указанных жанров не существуют'
                )
            }
        }
    },

    async deleteStory(id: string, userId: string) {
        const story = await prisma.story.findUnique({
            where: { id },
            include: {
                storyCollaborators: true,
            },
        })

        if (!story) {
            throw new NotFoundError(`Story not found by ${id}`)
        }

        const userRole = story.storyCollaborators.find(
            (c) => c.userId === userId
        )?.role

        if (!userRole || userRole !== 'ADMIN') {
            throw new ForbiddenError('У вас нет прав для удаления этой истории')
        }

        await prisma.story.delete({
            where: { id },
        })

        TimerService.clearAllTimers(id)

        return { success: true }
    },

    async getStoriesPaginated(
        page: number = 1,
        pageSize: number = 10,
        userId: string | undefined
    ) {
        const obj: Prisma.StoryFindManyArgs = {
            where: {
                OR: [{ isPublic: true }],
            },
            orderBy: { updatedAt: 'desc' as Prisma.SortOrder },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: { storyCollaborators: true, genres: true },
        }

        if (userId) {
            obj.where?.OR?.push({ storyCollaborators: { some: { userId } } })
        }

        console.log(obj.where?.OR)

        const totalCount = await prisma.story.count({
            where: obj.where,
        })

        const items = await prisma.story.findMany(obj)

        const totalPages = Math.ceil(totalCount / pageSize) || 1
        return { items, totalCount, totalPages, page, pageSize }
    },
}
