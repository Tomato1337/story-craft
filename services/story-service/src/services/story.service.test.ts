import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storyService } from './story.service'
import { prisma } from '../prisma'
import { TimerService } from './time.service'
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors'

vi.mock('../prisma', () => ({
    prisma: {
        story: {
            count: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
    Role: {
        ADMIN: 'ADMIN',
    },
}))

vi.mock('./time.service', () => ({
    TimerService: {
        setProposalTimer: vi.fn(),
        clearProposalTimer: vi.fn(),
        setVotingTimer: vi.fn(),
        clearVotingTimer: vi.fn(),
        clearAllTimers: vi.fn(),
    },
}))

vi.mock('./proposal.service', () => ({
    proposalService: {
        endProposals: vi.fn(),
        endVoting: vi.fn(),
    },
}))

describe('storyService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('getStoriesPaginated', () => {
        it('должен возвращать корректную пагинацию и вызывать prisma', async () => {
            const now = new Date()
            const fakeStories = [
                {
                    id: 's1',
                    createdAt: now,
                    updatedAt: now,
                    proposalDeadline: null,
                    votingDeadline: null,
                },
                {
                    id: 's2',
                    createdAt: now,
                    updatedAt: now,
                    proposalDeadline: null,
                    votingDeadline: null,
                },
            ]
            ;(prisma.story.count as any).mockResolvedValue(4)
            ;(prisma.story.findMany as any).mockResolvedValue(fakeStories)

            const result = await storyService.getStoriesPaginated(
                2,
                2,
                undefined
            )

            expect(prisma.story.count).toHaveBeenCalledWith({
                where: {
                    OR: [{ isPublic: true }],
                },
            })
            expect(prisma.story.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [{ isPublic: true }],
                },
                orderBy: { updatedAt: 'desc' },
                skip: 2,
                take: 2,
                include: { storyCollaborators: true, genres: true },
            })
            expect(result).toEqual({
                items: fakeStories.map((item) => ({
                    ...item,
                    proposalDeadline: null,
                    votingDeadline: null,
                })),
                totalCount: 4,
                totalPages: Math.ceil(4 / 2),
                page: 2,
                pageSize: 2,
            })
        })

        it('должен учитывать параметр userId при фильтрации историй', async () => {
            const now = new Date()
            const fakeStories = [
                {
                    id: 's1',
                    createdAt: now,
                    updatedAt: now,
                    proposalDeadline: null,
                    votingDeadline: null,
                },
            ]
            vi.mocked(prisma.story.count).mockResolvedValue(1)
            ;(prisma.story.findMany as any).mockResolvedValue(fakeStories)

            await storyService.getStoriesPaginated(1, 10, 'user1')

            expect(prisma.story.count).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { isPublic: true },
                        { storyCollaborators: { some: { userId: 'user1' } } },
                    ],
                },
            })
            expect(prisma.story.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { isPublic: true },
                        { storyCollaborators: { some: { userId: 'user1' } } },
                    ],
                },
                orderBy: { updatedAt: 'desc' },
                skip: 0,
                take: 10,
                include: { storyCollaborators: true, genres: true },
            })
        })
    })

    describe('createStory', () => {
        it('должен создавать новую историю с правильными данными', async () => {
            const now = new Date()
            const storyInput = {
                title: 'Test Story',
                description: 'Test Description',
                coverImageUrl: 'http://example.com/image.jpg',
                isPublic: true,
                proposalTime: 60000,
                votingTime: 60000,
                initialChapter: {
                    title: 'Chapter 1',
                    content: 'Once upon a time...',
                },
                genres: ['genre1', 'genre2'],
            }

            const createdStory = {
                id: 'story1',
                title: 'Test Story',
                description: 'Test Description',
                coverImageUrl: 'http://example.com/image.jpg',
                isPublic: true,
                proposalTime: 60000,
                votingTime: 60000,
                authorId: 'user1',
                createdAt: now,
                updatedAt: now,
                proposalDeadline: null,
                votingDeadline: null,
                currentPhase: 'PROPOSAL',
                viewCount: 0,
                storyCollaborators: [
                    {
                        id: 'collab1',
                        userId: 'user1',
                        role: 'ADMIN',
                        storyId: 'story1',
                    },
                ],
                genres: [
                    { id: 'genre1', name: 'Fantasy' },
                    { id: 'genre2', name: 'Sci-Fi' },
                ],
                chapters: [],
            }

            ;(prisma.story.create as any).mockResolvedValue(createdStory)

            const result = await storyService.createStory(storyInput, 'user1')

            expect(prisma.story.create).toHaveBeenCalledWith({
                data: {
                    title: storyInput.title,
                    description: storyInput.description,
                    coverImageUrl: storyInput.coverImageUrl,
                    isPublic: storyInput.isPublic,
                    proposalTime: storyInput.proposalTime,
                    votingTime: storyInput.votingTime,
                    authorId: 'user1',
                    chapters: {
                        create: {
                            title: storyInput.initialChapter.title,
                            content: storyInput.initialChapter.content,
                            authorId: 'user1',
                            position: 1,
                            isLastChapter: true,
                        },
                    },
                    genres: {
                        connect: [{ id: 'genre1' }, { id: 'genre2' }],
                    },
                    storyCollaborators: {
                        create: {
                            userId: 'user1',
                            role: 'ADMIN',
                        },
                    },
                },
                include: {
                    storyCollaborators: true,
                    genres: true,
                },
            })

            expect(result).toEqual({
                ...createdStory,
                storyCollaborators: [
                    { id: 'collab1', userId: 'user1', role: 'ADMIN' },
                ],
            })
        })

        it('должен вызывать BadRequestError при неверных жанрах', async () => {
            const error = new Error('Prisma error')
            error.code = 'P2025'
            vi.mocked(prisma.story.create).mockRejectedValue(error)

            const storyInput = {
                title: 'Test Story',
                description: 'Test Description',
                coverImageUrl: 'http://example.com/image.jpg',
                isPublic: true,
                proposalTime: 60000,
                votingTime: 60000,
                initialChapter: {
                    title: 'Chapter 1',
                    content: 'Once upon a time...',
                },
                genres: ['nonexistent'],
            }

            await expect(
                storyService.createStory(storyInput, 'user1')
            ).rejects.toThrow(BadRequestError)
        })
    })

    describe('getStoryById', () => {
        it('должен возвращать историю и увеличивать счетчик просмотров', async () => {
            const now = new Date()
            const story = {
                id: 'story1',
                title: 'Test Story',
                description: 'Test Description',
                viewCount: 5,
                createdAt: now,
                updatedAt: now,
                storyCollaborators: [],
                genres: [],
            }

            const updatedStory = {
                ...story,
                viewCount: 6,
            }

            ;(prisma.story.findUnique as any).mockResolvedValue(story)
            ;(prisma.story.update as any).mockResolvedValue(updatedStory)

            const result = await storyService.getStoryById('story1')

            expect(prisma.story.findUnique).toHaveBeenCalledWith({
                where: { id: 'story1' },
                include: {
                    storyCollaborators: true,
                    genres: true,
                },
            })
            expect(prisma.story.update).toHaveBeenCalledWith({
                where: { id: 'story1' },
                data: { viewCount: 6 },
                include: {
                    storyCollaborators: true,
                    genres: true,
                },
            })
            expect(result).toEqual(updatedStory)
        })

        it('должен выбрасывать NotFoundError если история не найдена', async () => {
            vi.mocked(prisma.story.findUnique).mockResolvedValue(null)

            await expect(
                storyService.getStoryById('nonexistent')
            ).rejects.toThrow(NotFoundError)
        })
    })

    describe('getMyStoriesPaginated', () => {
        it('должен возвращать истории пользователя', async () => {
            const now = new Date()
            const fakeStories = [
                {
                    id: 's1',
                    createdAt: now,
                    updatedAt: now,
                    proposalDeadline: null,
                    votingDeadline: null,
                    storyCollaborators: [{ userId: 'user1' }],
                    genres: [],
                },
            ]
            vi.mocked(prisma.story.count).mockResolvedValue(1)
            ;(prisma.story.findMany as any).mockResolvedValue(fakeStories)

            const result = await storyService.getMyStoriesPaginated(
                'user1',
                1,
                10
            )

            expect(prisma.story.count).toHaveBeenCalledWith({
                where: {
                    storyCollaborators: {
                        some: {
                            userId: 'user1',
                        },
                    },
                },
            })
            expect(prisma.story.findMany).toHaveBeenCalledWith({
                where: {
                    storyCollaborators: {
                        some: {
                            userId: 'user1',
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip: 0,
                take: 10,
                include: { storyCollaborators: true, genres: true },
            })
            expect(result).toEqual({
                items: fakeStories,
                totalCount: 1,
                totalPages: 1,
                page: 1,
                pageSize: 10,
            })
        })
    })

    describe('updateStory', () => {
        it('должен обновлять историю если пользователь имеет роль ADMIN', async () => {
            const now = new Date()
            const story = {
                id: 'story1',
                title: 'Old Title',
                description: 'Old Description',
                currentPhase: 'PROPOSAL',
                proposalTime: 60000,
                votingTime: 60000,
                proposalDeadline: null,
                votingDeadline: null,
                createdAt: now,
                updatedAt: now,
                storyCollaborators: [{ userId: 'user1', role: 'ADMIN' }],
                genres: [],
            }

            const updatedStory = {
                ...story,
                title: 'New Title',
                description: 'New Description',
            }

            ;(prisma.story.findUnique as any).mockResolvedValue(story)
            ;(prisma.story.update as any).mockResolvedValue(updatedStory)

            const result = await storyService.updateStory(
                'story1',
                { title: 'New Title', description: 'New Description' },
                'user1'
            )

            expect(prisma.story.findUnique).toHaveBeenCalledWith({
                where: { id: 'story1' },
                include: {
                    storyCollaborators: true,
                    genres: true,
                },
            })
            expect(prisma.story.update).toHaveBeenCalledWith({
                where: { id: 'story1' },
                data: {
                    title: 'New Title',
                    description: 'New Description',
                    genres: undefined,
                },
                include: {
                    storyCollaborators: true,
                    genres: true,
                },
            })
            expect(result).toEqual(updatedStory)
        })

        it('должен пересчитывать время proposal если proposalTime был изменен в фазе PROPOSAL', async () => {
            const now = new Date()
            const proposalDeadline = new Date(now.getTime() + 30000) // 30 секунд в будущем

            const story = {
                id: 'story1',
                proposalTime: 60000, // 60 сек
                currentPhase: 'PROPOSAL',
                proposalDeadline: proposalDeadline,
                storyCollaborators: [{ userId: 'user1', role: 'ADMIN' }],
                genres: [],
            }

            const updatedStory = {
                ...story,
                proposalTime: 120000, // 120 сек
            }

            ;(prisma.story.findUnique as any).mockResolvedValue(story)
            ;(prisma.story.update as any).mockResolvedValue(updatedStory)

            // Зафиксируем текущее время для предсказуемости
            const fixedNow = new Date('2023-01-01T12:00:00Z')
            vi.spyOn(global, 'Date').mockImplementation(() => fixedNow)

            await storyService.updateStory(
                'story1',
                { proposalTime: 120000 },
                'user1'
            )

            expect(TimerService.clearProposalTimer).toHaveBeenCalledWith(
                'story1'
            )
            expect(prisma.story.update).toHaveBeenCalled()
            expect(TimerService.setProposalTimer).toHaveBeenCalledWith(
                'story1',
                expect.any(Number),
                expect.any(Function)
            )
        })

        it('должен выбрасывать ForbiddenError если пользователь не имеет роль ADMIN', async () => {
            const story = {
                id: 'story1',
                storyCollaborators: [{ userId: 'user1', role: 'EDITOR' }],
                genres: [],
            }

            ;(prisma.story.findUnique as any).mockResolvedValue(story)

            await expect(
                storyService.updateStory(
                    'story1',
                    { title: 'New Title' },
                    'user1'
                )
            ).rejects.toThrow(ForbiddenError)
        })

        it('должен выбрасывать NotFoundError если история не найдена', async () => {
            vi.mocked(prisma.story.findUnique).mockResolvedValue(null)

            await expect(
                storyService.updateStory(
                    'nonexistent',
                    { title: 'New Title' },
                    'user1'
                )
            ).rejects.toThrow(NotFoundError)
        })
    })

    describe('deleteStory', () => {
        it('должен удалять историю если пользователь имеет роль ADMIN', async () => {
            const story = {
                id: 'story1',
                storyCollaborators: [{ userId: 'user1', role: 'ADMIN' }],
            }

            ;(prisma.story.findUnique as any).mockResolvedValue(story)
            ;(prisma.story.delete as any).mockResolvedValue({} as any)

            const result = await storyService.deleteStory('story1', 'user1')

            expect(prisma.story.findUnique).toHaveBeenCalledWith({
                where: { id: 'story1' },
                include: {
                    storyCollaborators: true,
                },
            })
            expect(prisma.story.delete).toHaveBeenCalledWith({
                where: { id: 'story1' },
            })
            expect(TimerService.clearAllTimers).toHaveBeenCalledWith('story1')
            expect(result).toEqual({ success: true })
        })

        it('должен выбрасывать ForbiddenError если пользователь не имеет роль ADMIN', async () => {
            const story = {
                id: 'story1',
                storyCollaborators: [{ userId: 'user1', role: 'EDITOR' }],
            }

            ;(prisma.story.findUnique as any).mockResolvedValue(story)

            await expect(
                storyService.deleteStory('story1', 'user1')
            ).rejects.toThrow(ForbiddenError)
        })

        it('должен выбрасывать NotFoundError если история не найдена', async () => {
            vi.mocked(prisma.story.findUnique).mockResolvedValue(null)

            await expect(
                storyService.deleteStory('nonexistent', 'user1')
            ).rejects.toThrow(NotFoundError)
        })
    })
})
