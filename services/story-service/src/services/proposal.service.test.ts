import { describe, it, expect, beforeEach, vi } from 'vitest'
import { proposalService } from './proposal.service'
import { prisma, Phase } from '../prisma'
import { chapterStoryService } from './chapter.service'
import { collaboratorService } from './collaborator.service'
import { TimerService } from './time.service'
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors'

vi.mock('../prisma', () => ({
    prisma: {
        chapterProposal: {
            count: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
            delete: vi.fn(),
        },
        chapter: {
            findFirst: vi.fn(),
            updateMany: vi.fn(),
        },
        story: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        storyCollaborator: {
            findFirst: vi.fn(),
        },
        vote: {
            findFirst: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        },
    },
    Phase: {
        PROPOSAL: 'PROPOSAL',
        VOTING: 'VOTING',
    },
}))

vi.mock('./chapter.service', () => ({
    chapterStoryService: {
        createChapter: vi.fn(),
    },
}))

vi.mock('./collaborator.service', () => ({
    collaboratorService: {
        addCollaboratorInStory: vi.fn(),
    },
}))

vi.mock('./time.service', () => ({
    TimerService: {
        setProposalTimer: vi.fn(),
        setVotingTimer: vi.fn(),
    },
}))

describe('proposalService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('getProposalsPaginated', () => {
        it('должен возвращать корректные данные и флаг hasWon=false', async () => {
            const now = new Date()
            const fakeProps = [
                {
                    id: 'p1',
                    voteCount: 0,
                    storyId: 's1',
                    parentChapterId: 'c1',
                    authorId: 'u1',
                    title: 't1',
                    content: 'c1',
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    id: 'p2',
                    voteCount: 2,
                    storyId: 's1',
                    parentChapterId: 'c1',
                    authorId: 'u1',
                    title: 't2',
                    content: 'c2',
                    createdAt: now,
                    updatedAt: now,
                },
            ]
            ;(prisma.chapterProposal.count as any).mockResolvedValue(2)
            ;(prisma.chapterProposal.findMany as any).mockResolvedValue(
                fakeProps
            )

            const result = await proposalService.getProposalsPaginated(
                's1',
                'c1',
                1,
                10
            )

            expect(prisma.chapterProposal.count).toHaveBeenCalledWith({
                where: { storyId: 's1', parentChapterId: 'c1' },
            })
            expect(prisma.chapterProposal.findMany).toHaveBeenCalledWith({
                where: { storyId: 's1', parentChapterId: 'c1' },
                orderBy: { createdAt: 'asc' },
                skip: 0,
                take: 10,
            })
            expect(result).toEqual({
                items: fakeProps.map((p) => ({
                    ...p,
                    hasWon: false,
                })),
                totalCount: 2,
                totalPages: 1,
                page: 1,
                pageSize: 10,
            })
        })
    })

    describe('createProposeChapter', () => {
        it('должен создавать новое предложение для главы', async () => {
            const now = new Date()
            const lastChapter = {
                id: 'c1',
                storyId: 's1',
                isLastChapter: true,
                position: 1,
            }
            const story = {
                id: 's1',
                currentPhase: Phase.PROPOSAL,
                proposalTime: 60000,
            }
            const proposal = {
                id: 'p1',
                storyId: 's1',
                parentChapterId: 'c1',
                authorId: 'u1',
                title: 'New Chapter',
                content: 'Chapter content',
                voteCount: 0,
                createdAt: now,
                updatedAt: now,
            }

            vi.mocked(prisma.chapter.findFirst).mockResolvedValue(
                lastChapter as any
            )
            vi.mocked(prisma.story.findUnique).mockResolvedValue(story as any)
            vi.mocked(prisma.chapterProposal.create).mockResolvedValue(
                proposal as any
            )
            vi.mocked(prisma.chapterProposal.count).mockResolvedValue(2)

            const result = await proposalService.createProposeChapter(
                's1',
                'c1',
                'u1',
                'New Chapter',
                'Chapter content'
            )

            expect(prisma.chapter.findFirst).toHaveBeenCalledWith({
                where: { storyId: 's1', isLastChapter: true },
                orderBy: { position: 'desc' },
            })
            expect(prisma.story.findUnique).toHaveBeenCalledWith({
                where: { id: 's1' },
            })
            expect(prisma.chapterProposal.create).toHaveBeenCalledWith({
                data: {
                    storyId: 's1',
                    parentChapterId: 'c1',
                    authorId: 'u1',
                    title: 'New Chapter',
                    content: 'Chapter content',
                },
            })
            expect(prisma.chapterProposal.count).toHaveBeenCalledWith({
                where: { storyId: 's1' },
            })
            expect(prisma.story.update).toHaveBeenCalled()
            expect(TimerService.setProposalTimer).toHaveBeenCalled()
            expect(result).toEqual(proposal)
        })
    })

    describe('deleteProposal', () => {
        it('должен удалять предложение если пользователь является автором', async () => {
            const proposal = {
                id: 'p1',
                storyId: 's1',
                authorId: 'u1',
            }
            const story = {
                id: 's1',
                currentPhase: Phase.PROPOSAL,
            }

            vi.mocked(prisma.chapterProposal.findUnique).mockResolvedValue(
                proposal as any
            )
            vi.mocked(prisma.story.findUnique).mockResolvedValue(story as any)
            vi.mocked(prisma.chapterProposal.delete).mockResolvedValue(
                {} as any
            )

            const result = await proposalService.deleteProposal(
                'p1',
                'u1',
                's1'
            )

            expect(prisma.chapterProposal.findUnique).toHaveBeenCalledWith({
                where: { id: 'p1', storyId: 's1' },
            })
            expect(prisma.story.findUnique).toHaveBeenCalledWith({
                where: { id: 's1' },
            })
            expect(prisma.chapterProposal.delete).toHaveBeenCalledWith({
                where: { id: 'p1', storyId: 's1' },
            })
            expect(result).toEqual({ success: true })
        })

        it('должен выбрасывать ошибку если пользователь не является автором', async () => {
            const proposal = {
                id: 'p1',
                storyId: 's1',
                authorId: 'u2', // другой пользователь
            }
            const story = {
                id: 's1',
                currentPhase: Phase.PROPOSAL,
            }

            vi.mocked(prisma.chapterProposal.findUnique).mockResolvedValue(
                proposal as any
            )
            vi.mocked(prisma.story.findUnique).mockResolvedValue(story as any)

            await expect(
                proposalService.deleteProposal('p1', 'u1', 's1')
            ).rejects.toThrow(ForbiddenError)
        })
    })

    describe('changeProposal', () => {
        it('должен изменять предложение если пользователь является автором', async () => {
            const proposal = {
                id: 'p1',
                storyId: 's1',
                authorId: 'u1',
                title: 'Old title',
                content: 'Old content',
            }
            const updatedProposal = {
                ...proposal,
                title: 'New title',
                content: 'New content',
            }
            const story = {
                id: 's1',
                currentPhase: Phase.PROPOSAL,
            }

            vi.mocked(prisma.chapterProposal.findUnique).mockResolvedValue(
                proposal as any
            )
            vi.mocked(prisma.story.findUnique).mockResolvedValue(story as any)
            vi.mocked(prisma.chapterProposal.update).mockResolvedValue(
                updatedProposal as any
            )

            const result = await proposalService.changeProposal(
                'p1',
                'u1',
                's1',
                'New title',
                'New content'
            )

            expect(prisma.chapterProposal.findUnique).toHaveBeenCalledWith({
                where: { id: 'p1', storyId: 's1' },
            })
            expect(prisma.chapterProposal.update).toHaveBeenCalledWith({
                where: { id: 'p1', storyId: 's1' },
                data: { title: 'New title', content: 'New content' },
            })
            expect(result).toEqual(updatedProposal)
        })
    })

    describe('selectWinnerProposal', () => {
        it('должен выбирать победившее предложение если пользователь админ', async () => {
            const proposal = {
                id: 'p1',
                storyId: 's1',
                authorId: 'u2',
                title: 'Winner title',
                content: 'Winner content',
            }
            const collaborator = {
                userId: 'u1',
                storyId: 's1',
                role: 'ADMIN',
            }

            vi.mocked(prisma.chapterProposal.findUnique).mockResolvedValue(
                proposal as any
            )
            vi.mocked(prisma.storyCollaborator.findFirst).mockResolvedValue(
                collaborator as any
            )

            await proposalService.selectWinnerProposal('p1', 'u1')

            expect(prisma.story.update).toHaveBeenCalledWith({
                where: { id: 's1' },
                data: { currentPhase: Phase.PROPOSAL, votingDeadline: null },
            })
            expect(prisma.chapter.updateMany).toHaveBeenCalledWith({
                where: { storyId: 's1', isLastChapter: true },
                data: { isLastChapter: false },
            })
            expect(chapterStoryService.createChapter).toHaveBeenCalledWith(
                's1',
                { title: 'Winner title', content: 'Winner content' },
                'u2'
            )
            expect(
                collaboratorService.addCollaboratorInStory
            ).toHaveBeenCalledWith('s1', 'u2')
            expect(prisma.chapterProposal.deleteMany).toHaveBeenCalledWith({
                where: { storyId: 's1' },
            })
        })
    })

    describe('voteProposal', () => {
        it('должен добавлять голос за предложение', async () => {
            const proposal = {
                id: 'p1',
                storyId: 's1',
            }
            const story = {
                id: 's1',
                currentPhase: Phase.VOTING,
            }

            vi.mocked(prisma.chapterProposal.findUnique).mockResolvedValue(
                proposal as any
            )
            vi.mocked(prisma.story.findUnique).mockResolvedValue(story as any)
            vi.mocked(prisma.vote.findFirst).mockResolvedValue(null)

            const result = await proposalService.voteProposal('p1', 'u1')

            expect(prisma.vote.create).toHaveBeenCalledWith({
                data: { chapterProposalId: 'p1', authorId: 'u1' },
            })
            expect(prisma.chapterProposal.update).toHaveBeenCalledWith({
                where: { id: 'p1' },
                data: { voteCount: { increment: 1 } },
            })
            expect(result).toEqual({ success: true })
        })

        it('должен выбросить ошибку, если пользователь уже голосовал', async () => {
            const proposal = {
                id: 'p1',
                storyId: 's1',
            }
            const vote = {
                id: 'v1',
                chapterProposalId: 'p1',
                authorId: 'u1',
            }
            const story = {
                id: 's1',
                currentPhase: Phase.VOTING,
            }

            vi.mocked(prisma.chapterProposal.findUnique).mockResolvedValue(
                proposal as any
            )
            vi.mocked(prisma.story.findUnique).mockResolvedValue(story as any)
            vi.mocked(prisma.vote.findFirst).mockResolvedValue(vote as any)

            await expect(
                proposalService.voteProposal('p1', 'u1')
            ).rejects.toThrow(ConflictError)
        })
    })

    describe('getProposalById', () => {
        it('должен возвращать предложение по id', async () => {
            const now = new Date()
            const proposal = {
                id: 'p1',
                title: 'Test proposal',
                content: 'Content',
                votes: [],
                createdAt: now,
                updatedAt: now,
            }

            vi.mocked(prisma.chapterProposal.findUnique).mockResolvedValue(
                proposal as any
            )

            const result = await proposalService.getProposalById('p1')

            expect(prisma.chapterProposal.findUnique).toHaveBeenCalledWith({
                where: { id: 'p1' },
                include: { votes: true },
            })
            expect(result).toEqual(proposal)
        })

        it('должен выбросить ошибку, если предложение не найдено', async () => {
            vi.mocked(prisma.chapterProposal.findUnique).mockResolvedValue(null)

            await expect(proposalService.getProposalById('p1')).rejects.toThrow(
                NotFoundError
            )
        })
    })

    describe('endVoting', () => {
        it('должен выбирать победителя с наибольшим количеством голосов', async () => {
            const proposals = [
                {
                    id: 'p1',
                    voteCount: 3,
                    title: 'Winner',
                    content: 'Content',
                    authorId: 'u1',
                    storyId: 's1',
                },
                {
                    id: 'p2',
                    voteCount: 1,
                    title: 'Loser',
                    content: 'Content',
                    authorId: 'u2',
                    storyId: 's1',
                },
            ]

            vi.mocked(prisma.chapterProposal.findMany).mockResolvedValue(
                proposals as any
            )

            await proposalService.endVoting('s1')

            expect(prisma.story.update).toHaveBeenCalledWith({
                where: { id: 's1' },
                data: { currentPhase: Phase.PROPOSAL, votingDeadline: null },
            })
            expect(prisma.chapter.updateMany).toHaveBeenCalledWith({
                where: { storyId: 's1', isLastChapter: true },
                data: { isLastChapter: false },
            })
            expect(chapterStoryService.createChapter).toHaveBeenCalledWith(
                's1',
                { title: 'Winner', content: 'Content' },
                'u1'
            )
            expect(
                collaboratorService.addCollaboratorInStory
            ).toHaveBeenCalledWith('s1', 'u1')
            expect(prisma.chapterProposal.deleteMany).toHaveBeenCalledWith({
                where: { storyId: 's1' },
            })
        })

        it('должен случайно выбирать победителя, если нет голосов', async () => {
            const proposals = [
                {
                    id: 'p1',
                    voteCount: 0,
                    title: 'First',
                    content: 'Content',
                    authorId: 'u1',
                    storyId: 's1',
                },
                {
                    id: 'p2',
                    voteCount: 0,
                    title: 'Second',
                    content: 'Content',
                    authorId: 'u2',
                    storyId: 's1',
                },
            ]

            vi.mocked(prisma.chapterProposal.findMany).mockResolvedValue(
                proposals as any
            )

            global.Math.random = vi.fn().mockReturnValue(0.1)

            await proposalService.endVoting('s1')

            expect(chapterStoryService.createChapter).toHaveBeenCalled()
            expect(
                collaboratorService.addCollaboratorInStory
            ).toHaveBeenCalled()
        })
    })
})
