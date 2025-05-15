import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { TimerService } from './time.service'

describe('TimerService', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        ;(TimerService as any).timers = new Map()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('setProposalTimer', () => {
        it('должен устанавливать таймер предложений', () => {
            const callback = vi.fn()

            TimerService.setProposalTimer('story1', 1000, callback)

            expect((TimerService as any).timers.has('story1')).toBe(true)
            expect(
                (TimerService as any).timers.get('story1').proposalTimer
            ).toBeDefined()

            expect(callback).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1000)

            expect(callback).toHaveBeenCalledTimes(1)
        })

        it('должен очищать предыдущий таймер при установке нового', () => {
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

            TimerService.setProposalTimer('story1', 1000, callback1)
            TimerService.setProposalTimer('story1', 2000, callback2)

            expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)

            vi.advanceTimersByTime(1000)

            expect(callback1).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1000)

            expect(callback2).toHaveBeenCalledTimes(1)
        })
    })

    describe('setVotingTimer', () => {
        it('должен устанавливать таймер голосования', () => {
            const callback = vi.fn()

            TimerService.setVotingTimer('story1', 1500, callback)

            expect((TimerService as any).timers.has('story1')).toBe(true)
            expect(
                (TimerService as any).timers.get('story1').votingTimer
            ).toBeDefined()

            expect(callback).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1500)

            expect(callback).toHaveBeenCalledTimes(1)
        })

        it('должен очищать предыдущий таймер при установке нового', () => {
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

            TimerService.setVotingTimer('story1', 1000, callback1)
            TimerService.setVotingTimer('story1', 2000, callback2)

            expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)

            vi.advanceTimersByTime(1000)

            expect(callback1).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1000)

            expect(callback2).toHaveBeenCalledTimes(1)
        })
    })

    describe('clearProposalTimer', () => {
        it('должен очищать таймер предложений', () => {
            const callback = vi.fn()
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

            TimerService.setProposalTimer('story1', 1000, callback)
            TimerService.clearProposalTimer('story1')

            expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)

            vi.advanceTimersByTime(1000)

            expect(callback).not.toHaveBeenCalled()

            expect(
                (TimerService as any).timers.get('story1').proposalTimer
            ).toBeUndefined()
        })

        it('не должен вызывать ошибку если таймер не существует', () => {
            expect(() => {
                TimerService.clearProposalTimer('nonexistentStory')
            }).not.toThrow()
        })
    })

    describe('clearVotingTimer', () => {
        it('должен очищать таймер голосования', () => {
            const callback = vi.fn()
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

            TimerService.setVotingTimer('story1', 1000, callback)
            TimerService.clearVotingTimer('story1')

            expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)

            vi.advanceTimersByTime(1000)

            expect(callback).not.toHaveBeenCalled()

            expect(
                (TimerService as any).timers.get('story1').votingTimer
            ).toBeUndefined()
        })

        it('не должен вызывать ошибку если таймер не существует', () => {
            expect(() => {
                TimerService.clearVotingTimer('nonexistentStory')
            }).not.toThrow()
        })
    })

    describe('clearAllTimers', () => {
        it('должен очищать все таймеры истории', () => {
            const proposalCallback = vi.fn()
            const votingCallback = vi.fn()
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

            TimerService.setProposalTimer('story1', 1000, proposalCallback)
            TimerService.setVotingTimer('story1', 1500, votingCallback)

            TimerService.clearAllTimers('story1')

            expect(clearTimeoutSpy).toHaveBeenCalledTimes(2)

            vi.advanceTimersByTime(1500)

            expect(proposalCallback).not.toHaveBeenCalled()
            expect(votingCallback).not.toHaveBeenCalled()

            expect((TimerService as any).timers.has('story1')).toBe(false)
        })

        it('не должен вызывать ошибку если таймеры не существуют', () => {
            expect(() => {
                TimerService.clearAllTimers('nonexistentStory')
            }).not.toThrow()
        })
    })

    it('должен поддерживать независимые таймеры для разных историй', () => {
        const callback1 = vi.fn()
        const callback2 = vi.fn()

        TimerService.setProposalTimer('story1', 1000, callback1)
        TimerService.setProposalTimer('story2', 2000, callback2)

        expect((TimerService as any).timers.has('story1')).toBe(true)
        expect((TimerService as any).timers.has('story2')).toBe(true)

        vi.advanceTimersByTime(1000)

        expect(callback1).toHaveBeenCalledTimes(1)
        expect(callback2).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1000)

        expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('должен корректно работать со смешанными таймерами', () => {
        const proposalCallback = vi.fn()
        const votingCallback = vi.fn()

        TimerService.setProposalTimer('story1', 1000, proposalCallback)
        TimerService.setVotingTimer('story1', 2000, votingCallback)

        vi.advanceTimersByTime(1000)

        expect(proposalCallback).toHaveBeenCalledTimes(1)
        expect(votingCallback).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1000)

        expect(votingCallback).toHaveBeenCalledTimes(1)
    })
})
