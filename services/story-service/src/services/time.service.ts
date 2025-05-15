interface StoryTimers {
    proposalTimer?: NodeJS.Timeout
    votingTimer?: NodeJS.Timeout
}

export class TimerService {
    private static timers: Map<string, StoryTimers> = new Map()

    static setProposalTimer(
        storyId: string,
        duration: number,
        callback: () => void
    ): void {
        this.clearProposalTimer(storyId)
        const timer = setTimeout(callback, duration)

        if (!this.timers.has(storyId)) {
            this.timers.set(storyId, {})
        }

        this.timers.get(storyId)!.proposalTimer = timer
        console.log(
            `Установлен таймер предложений для истории ${storyId} на ${duration}ms`
        )
    }

    static setVotingTimer(
        storyId: string,
        duration: number,
        callback: () => void
    ): void {
        this.clearVotingTimer(storyId)
        const timer = setTimeout(callback, duration)

        if (!this.timers.has(storyId)) {
            this.timers.set(storyId, {})
        }

        this.timers.get(storyId)!.votingTimer = timer
        console.log(
            `Установлен таймер голосования для истории ${storyId} на ${duration}ms`
        )
    }

    static clearProposalTimer(storyId: string): void {
        const storyTimers = this.timers.get(storyId)
        if (storyTimers?.proposalTimer) {
            clearTimeout(storyTimers.proposalTimer)
            console.log(`Очищен таймер предложений для истории ${storyId}`)
            storyTimers.proposalTimer = undefined
        }
    }

    static clearVotingTimer(storyId: string): void {
        const storyTimers = this.timers.get(storyId)
        if (storyTimers?.votingTimer) {
            clearTimeout(storyTimers.votingTimer)
            console.log(`Очищен таймер голосования для истории ${storyId}`)
            storyTimers.votingTimer = undefined
        }
    }

    static clearAllTimers(storyId: string): void {
        this.clearProposalTimer(storyId)
        this.clearVotingTimer(storyId)
        this.timers.delete(storyId)
        console.log(`Очищены все таймеры для истории ${storyId}`)
    }
}
