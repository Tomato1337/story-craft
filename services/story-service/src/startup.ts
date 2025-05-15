import { prisma, Phase } from './prisma'
import { proposalService } from './services/proposal.service'
import { TimerService } from './services/time.service'

export async function initializeTimers() {
    console.log('Инициализация таймеров для активных историй...')

    const storiesWithDeadlines = await prisma.story.findMany({
        where: {
            OR: [
                { proposalDeadline: { not: null } },
                { votingDeadline: { not: null } },
            ],
        },
    })

    const now = new Date().getTime()

    for (const story of storiesWithDeadlines) {
        if (story.currentPhase === Phase.PROPOSAL && story.proposalDeadline) {
            const deadline = story.proposalDeadline.getTime()
            const remainingTime = Math.max(deadline - now, 0)

            if (remainingTime > 0) {
                console.log(
                    `Инициализация таймера предложений для истории ${story.id}, осталось ${remainingTime}ms`
                )
                TimerService.setProposalTimer(story.id, remainingTime, () =>
                    proposalService.endProposals(story.id)
                )
            } else {
                console.log(
                    `Пропущен дедлайн предложений для истории ${story.id}, завершаем фазу немедленно`
                )
                proposalService.endProposals(story.id).catch((err) => {
                    console.error(
                        `Ошибка при завершении фазы предложений для истории ${story.id}:`,
                        err
                    )
                })
            }
        }

        if (story.currentPhase === Phase.VOTING && story.votingDeadline) {
            const deadline = story.votingDeadline.getTime()
            const remainingTime = Math.max(deadline - now, 0)

            if (remainingTime > 0) {
                console.log(
                    `Инициализация таймера голосования для истории ${story.id}, осталось ${remainingTime}ms`
                )
                TimerService.setVotingTimer(story.id, remainingTime, () =>
                    proposalService.endVoting(story.id)
                )
            } else {
                console.log(
                    `Пропущен дедлайн голосования для истории ${story.id}, завершаем фазу немедленно`
                )
                proposalService.endVoting(story.id).catch((err) => {
                    console.error(
                        `Ошибка при завершении фазы голосования для истории ${story.id}:`,
                        err
                    )
                })
            }
        }
    }

    console.log(`Инициализировано ${storiesWithDeadlines.length} таймеров`)
}
