import { prisma, Phase } from '../prisma'
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from '../utils/errors'
import { chapterStoryService } from './chapter.service'
import { collaboratorService } from './collaborator.service'
import { TimerService } from './time.service'

export const proposalService = {
    async createProposeChapter(
        storyId: string,
        parentChapterId: string,
        authorId: string,
        title: string,
        content: string
    ) {
        const lastChapter = await prisma.chapter.findFirst({
            where: { storyId, isLastChapter: true },
            orderBy: { position: 'desc' },
        })
        if (!lastChapter || lastChapter.id !== parentChapterId) {
            throw new BadRequestError('Нет доступной главы для продолжения')
        }

        const story = await prisma.story.findUnique({ where: { id: storyId } })
        if (!story)
            throw new NotFoundError(`История с ID ${storyId} не найдена`)
        if (story.currentPhase !== Phase.PROPOSAL)
            throw new BadRequestError(
                'Сейчас не фаза предложений для этой истории'
            )

        const proposal = await prisma.chapterProposal.create({
            data: { storyId, parentChapterId, authorId, title, content },
        })

        // После второго предложения запускаем таймер
        const count = await prisma.chapterProposal.count({ where: { storyId } })
        if (count >= 2) {
            const deadline = new Date(Date.now() + story.proposalTime)
            await prisma.story.update({
                where: { id: storyId },
                data: { proposalDeadline: deadline },
            })
            TimerService.setProposalTimer(storyId, story.proposalTime, () =>
                this.endProposals(storyId)
            )
        }

        return proposal
    },

    async deleteProposal(
        proposalId: string,
        authorId: string,
        storyId: string
    ) {
        const proposal = await prisma.chapterProposal.findUnique({
            where: { id: proposalId, storyId },
        })
        if (!proposal)
            throw new NotFoundError(`Предложение с ID ${proposalId} не найдено`)

        const story = await prisma.story.findUnique({
            where: { id: storyId },
        })

        if (!story) {
            throw new NotFoundError(`История с ID ${storyId} не найдена`)
        }

        if (story.currentPhase !== Phase.PROPOSAL) {
            throw new BadRequestError(
                'Сейчас не фаза предложений для этой истории'
            )
        }

        if (proposal.authorId !== authorId) {
            throw new ForbiddenError(
                'Вы не являетесь автором этого предложения'
            )
        }

        await prisma.chapterProposal.delete({
            where: { id: proposalId, storyId },
        })

        return { success: true }
    },

    async changeProposal(
        proposalId: string,
        authorId: string,
        storyId: string,
        title?: string,
        content?: string
    ) {
        const proposal = await prisma.chapterProposal.findUnique({
            where: { id: proposalId, storyId },
        })

        if (!proposal) {
            throw new NotFoundError(`Предложение с ID ${proposalId} не найдено`)
        }

        const story = await prisma.story.findUnique({
            where: { id: storyId },
        })

        if (!story) {
            throw new NotFoundError(`История с ID ${storyId} не найдена`)
        }

        if (story.currentPhase !== Phase.PROPOSAL) {
            throw new BadRequestError(
                'Сейчас не фаза предложений для этой истории'
            )
        }

        if (proposal.authorId !== authorId) {
            throw new ForbiddenError(
                'Вы не являетесь автором этого предложения'
            )
        }

        const proposalAfter = await prisma.chapterProposal.update({
            where: { id: proposalId, storyId },
            data: { title, content },
        })

        console.log(`Proposal ${proposalId} changed by user ${authorId}`)

        return proposalAfter
    },

    async selectWinnerProposal(proposalId: string, authorId: string) {
        const proposal = await prisma.chapterProposal.findUnique({
            where: { id: proposalId },
        })

        if (!proposal)
            throw new NotFoundError(`Предложение с ID ${proposalId} не найдено`)

        const collaborator = await prisma.storyCollaborator.findFirst({
            where: { storyId: proposal.storyId, userId: authorId },
        })

        if (!collaborator || collaborator.role !== 'ADMIN') {
            throw new ForbiddenError(
                'Вы не являетесь владельцем этой истории, выбора победителя невозможен'
            )
        }

        await prisma.story.update({
            where: { id: proposal.storyId },
            data: { currentPhase: Phase.PROPOSAL, votingDeadline: null },
        })

        await prisma.chapter.updateMany({
            where: { storyId: proposal.storyId, isLastChapter: true },
            data: { isLastChapter: false },
        })

        await chapterStoryService.createChapter(
            proposal.storyId,
            {
                title: proposal.title,
                content: proposal.content,
            },
            proposal.authorId
        )

        await collaboratorService.addCollaboratorInStory(
            proposal.storyId,
            proposal.authorId
        )

        await prisma.chapterProposal.deleteMany({
            where: { storyId: proposal.storyId },
        })
    },

    async voteProposal(proposalId: string, authorId: string) {
        const proposal = await prisma.chapterProposal.findUnique({
            where: { id: proposalId },
        })
        if (!proposal) {
            throw new NotFoundError(`Предложение с ID ${proposalId} не найдено`)
        }

        const story = await prisma.story.findUnique({
            where: { id: proposal.storyId },
        })

        const user = await prisma.vote.findFirst({
            where: { chapterProposalId: proposalId, authorId },
        })

        if (user)
            throw new ConflictError('Вы уже голосовали за это предложение')

        if (!story || story.currentPhase !== Phase.VOTING)
            throw new BadRequestError(
                'Сейчас не фаза голосования для этой истории'
            )

        await prisma.vote.create({
            data: { chapterProposalId: proposalId, authorId },
        })

        await prisma.chapterProposal.update({
            where: { id: proposalId },
            data: { voteCount: { increment: 1 } },
        })

        console.log(`User ${authorId} voted for proposal ${proposalId}`)

        return { success: true }
    },

    async deleteVoteProposal(proposalId: string, authorId: string) {
        const proposal = await prisma.chapterProposal.findUnique({
            where: { id: proposalId, authorId },
        })
        if (!proposal)
            throw new NotFoundError(`Предложение с ID ${proposalId} не найдено`)

        const story = await prisma.story.findUnique({
            where: { id: proposal.storyId },
        })

        const user = await prisma.vote.findFirst({
            where: { chapterProposalId: proposalId, authorId },
        })

        if (!user)
            throw new BadRequestError('Вы не голосовали за это предложение')

        if (!story || story.currentPhase !== Phase.VOTING)
            throw new BadRequestError('Не в фазе голосования')

        await prisma.vote.delete({
            where: { id: user.id },
        })

        await prisma.chapterProposal.update({
            where: { id: proposalId },
            data: { voteCount: { decrement: 1 } },
        })

        console.log(`User ${authorId} deleted vote for proposal ${proposalId}`)

        return { success: true }
    },

    async getProposals(storyId: string, parentChapterId: string) {
        const proposals = await prisma.chapterProposal.findMany({
            where: { storyId, parentChapterId },
            include: { votes: true },
        })
        return proposals
    },

    async getProposalById(id: string) {
        const proposal = await prisma.chapterProposal.findUnique({
            where: { id },
            include: { votes: true },
        })
        if (!proposal)
            throw new NotFoundError(`Предложение с ID ${id} не найдено`)

        return proposal
    },

    async getProposalsPaginated(
        storyId: string,
        parentChapterId: string,
        page: number = 1,
        pageSize: number = 10
    ) {
        const totalCount = await prisma.chapterProposal.count({
            where: { storyId, parentChapterId },
        })
        const items = await prisma.chapterProposal.findMany({
            where: { storyId, parentChapterId },
            orderBy: { createdAt: 'asc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })
        const totalPages = Math.ceil(totalCount / pageSize) || 1

        const itemsWithHasWon = items.map((item) => ({
            ...item,
            hasWon: false,
        }))
        return {
            items: itemsWithHasWon,
            totalCount,
            totalPages,
            page,
            pageSize,
        }
    },

    async endProposals(storyId: string) {
        const story = await prisma.story.findUnique({
            where: { id: storyId },
        })

        if (!story) {
            throw new NotFoundError(`История с ID ${storyId} не найдена`)
        }

        const votingDeadline = new Date(Date.now() + story.votingTime)
        await prisma.story.update({
            where: { id: storyId },
            data: {
                currentPhase: Phase.VOTING,
                votingDeadline,
                proposalDeadline: null,
            },
        })

        TimerService.setVotingTimer(storyId, story.votingTime, () =>
            this.endVoting(storyId)
        )
    },

    async endVoting(storyId: string) {
        const proposals = await prisma.chapterProposal.findMany({
            where: { storyId },
        })

        if (proposals.length === 0) {
            await prisma.story.update({
                where: { id: storyId },
                data: { currentPhase: Phase.PROPOSAL, votingDeadline: null },
            })

            return
        }

        let winner
        const allCountVotes = proposals.reduce((acc, proposal) => {
            acc += proposal.voteCount
            return acc
        }, 0)

        if (allCountVotes === 0) {
            const randomIndex = Math.floor(Math.random() * proposals.length)
            winner = proposals[randomIndex]
        } else {
            winner = proposals.reduce((prev, cur) =>
                prev.voteCount > cur.voteCount ? prev : cur
            )
        }

        await prisma.story.update({
            where: { id: storyId },
            data: { currentPhase: Phase.PROPOSAL, votingDeadline: null },
        })

        await prisma.chapter.updateMany({
            where: { storyId, isLastChapter: true },
            data: { isLastChapter: false },
        })

        await chapterStoryService.createChapter(
            storyId,
            {
                title: winner.title,
                content: winner.content,
            },
            winner.authorId
        )

        await collaboratorService.addCollaboratorInStory(
            storyId,
            winner.authorId
        )

        await prisma.chapterProposal.deleteMany({ where: { storyId } })
    },
}
