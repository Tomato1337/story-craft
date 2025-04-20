import { prisma, Phase } from '../prisma'
import { chapterStoryService } from './chapter.service'
import { collaboratorService } from './collaborator.service'

// Время фаз (в мс), можно вынести в конфиг
const PROPOSAL_DURATION = 1000 * 60 * 1
const VOTING_DURATION = 1000 * 60 * 1

export const proposalService = {
    async proposeChapter(
        storyId: string,
        parentChapterId: string,
        authorId: string,
        title: string,
        content: string
    ) {
        // Получаем последнюю главу для привязки предложения
        const lastChapter = await prisma.chapter.findFirst({
            where: { storyId, isLastChapter: true },
            orderBy: { position: 'desc' },
        })
        if (!lastChapter || lastChapter.id !== parentChapterId) {
            throw new Error('Нет доступной главы для продолжения')
        }

        // Проверка фазы и остальные проверки...
        const story = await prisma.story.findUnique({ where: { id: storyId } })
        if (!story) throw new Error('Story not found')
        if (story.currentPhase !== Phase.PROPOSAL)
            throw new Error('Not in proposal phase')

        // Создание предложения, используя найденный parentChapterId
        const proposal = await prisma.chapterProposal.create({
            data: { storyId, parentChapterId, authorId, title, content },
        })

        // После второго предложения запускаем таймер
        const count = await prisma.chapterProposal.count({ where: { storyId } })
        if (count === 2) {
            const deadline = new Date(Date.now() + PROPOSAL_DURATION)
            await prisma.story.update({
                where: { id: storyId },
                data: { proposalDeadline: deadline },
            })
            setTimeout(() => this.endProposals(storyId), PROPOSAL_DURATION)
        }

        return proposal
    },

    async voteProposal(proposalId: string, authorId: string) {
        const proposal = await prisma.chapterProposal.findUnique({
            where: { id: proposalId },
        })
        if (!proposal) throw new Error('Proposal not found')

        const story = await prisma.story.findUnique({
            where: { id: proposal.storyId },
        })
        if (!story || story.currentPhase !== Phase.VOTING)
            throw new Error('Not in voting phase')

        // Создаем голос
        await prisma.vote.create({
            data: { chapterProposalId: proposalId, authorId },
        })
        return { success: true }
    },

    async getProposals(storyId: string, parentChapterId: string) {
        return prisma.chapterProposal.findMany({
            where: { storyId, parentChapterId },
            include: { votes: true },
        })
    },

    async endProposals(storyId: string) {
        // Меняем фазу на VOTING и устанавливаем дедлайн
        const votingDeadline = new Date(Date.now() + VOTING_DURATION)
        await prisma.story.update({
            where: { id: storyId },
            data: { currentPhase: Phase.VOTING, votingDeadline },
        })
        // Запускаем таймер завершения голосования
        setTimeout(() => this.endVoting(storyId), VOTING_DURATION)
    },

    async endVoting(storyId: string) {
        // Подводим итоги
        const proposals = await prisma.chapterProposal.findMany({
            where: { storyId },
        })
        // Находим победителя с max voteCount
        const winner = proposals.reduce((prev, cur) =>
            prev.voteCount > cur.voteCount ? prev : cur
        )

        // Снимаем флаг isLastChapter со старой главы
        await prisma.chapter.updateMany({
            where: { storyId, isLastChapter: true },
            data: { isLastChapter: false },
        })

        // // Добавляем новую главу из победившего предложения
        // const newChapter = await prisma.chapter.create({
        //     data: {
        //         storyId,
        //         title: winner.title,
        //         content: winner.content,
        //         authorId: winner.authorId,
        //         position: proposals.length + 1,
        //         isLastChapter: true,
        //     },
        // })

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

        // Обновляем story: сбрасываем предложения, переводим в следующую фазу
        // await prisma.story.update({
        //     where: { id: storyId },
        //     data: {
        //         chapters: { connect: { id: newChapter.id } },
        //         currentPhase: Phase.PROPOSAL,
        //         proposalDeadline: null,
        //         votingDeadline: null,
        //     },
        // })

        // Удаляем предыдущие предложения
        await prisma.chapterProposal.deleteMany({ where: { storyId } })
    },
}
