import { describe, it, expect, beforeEach, vi } from 'vitest'
import { chapterController } from './chapter.controller'
import { chapterStoryService } from '../services/chapter.service'
import { proposalService } from '../services/proposal.service'
import { NotFoundError, UnauthorizedError } from '../utils/errors'
import { FastifyReply, FastifyRequest } from 'fastify'

vi.mock('../services/chapter.service', () => ({
    chapterStoryService: {
        getChaptersPaginated: vi.fn(),
        getChapterById: vi.fn(),
    },
}))

vi.mock('../services/proposal.service', () => ({
    proposalService: {
        createProposeChapter: vi.fn(),
        getProposalsPaginated: vi.fn(),
        getProposalById: vi.fn(),
        voteProposal: vi.fn(),
        deleteVoteProposal: vi.fn(),
        deleteProposal: vi.fn(),
        changeProposal: vi.fn(),
        selectWinnerProposal: vi.fn(),
    },
}))

describe('chapterController', () => {
    let request: Partial<FastifyRequest>
    let reply: Partial<FastifyReply>
    beforeEach(() => {
        vi.resetAllMocks()

        reply = {
            code: vi.fn().mockReturnThis(),
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        }
    })

    describe('getChapters', () => {
        it('должен вызывать сервис и возвращать результаты пагинации', async () => {
            const paginationResult = {
                items: [
                    {
                        id: 'chapter1',
                        title: 'Chapter 1',
                        content: '',
                        authorId: '',
                        storyId: '',
                        position: 1,
                        isLastChapter: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
                totalCount: 1,
                totalPages: 1,
                page: 1,
                pageSize: 10,
            }

            vi.mocked(
                chapterStoryService.getChaptersPaginated
            ).mockResolvedValue(paginationResult)

            request = {
                params: { storyId: 'story1' },
                query: { page: 1, pageSize: 10 },
            }

            await chapterController.getChapters(request as any, reply as any)

            expect(
                chapterStoryService.getChaptersPaginated
            ).toHaveBeenCalledWith('story1', 1, 10)
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith(paginationResult)
        })

        it('должен использовать значения по умолчанию для параметров пагинации', async () => {
            const paginationResult = {
                items: [
                    {
                        id: 'chapter1',
                        title: 'Chapter 1',
                        content: '',
                        authorId: '',
                        storyId: '',
                        position: 1,
                        isLastChapter: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
                totalCount: 1,
                totalPages: 1,
                page: 1,
                pageSize: 10,
            }
            vi.mocked(
                chapterStoryService.getChaptersPaginated
            ).mockResolvedValue(paginationResult)

            request = {
                params: { storyId: 'story1' },
                query: {},
            }

            await chapterController.getChapters(request as any, reply as any)

            expect(
                chapterStoryService.getChaptersPaginated
            ).toHaveBeenCalledWith('story1', 1, 10)
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith(paginationResult)
        })
    })

    describe('getChapterById', () => {
        it('должен вернуть главу по ID', async () => {
            const chapterData = {
                id: 'chapter1',
                title: 'Chapter 1',
                content: '',
                authorId: '',
                storyId: '',
                position: 1,
                isLastChapter: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            vi.mocked(chapterStoryService.getChapterById).mockResolvedValue(
                chapterData
            )

            request = {
                params: { storyId: 'story1', chapterId: 'chapter1' },
            }

            await chapterController.getChapterById(request as any, reply as any)

            expect(chapterStoryService.getChapterById).toHaveBeenCalledWith(
                'chapter1'
            )
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith(chapterData)
        })

        it('должен обработать ошибку, если глава не найдена', async () => {
            ;(chapterStoryService.getChapterById as any).mockResolvedValue(null)

            request = {
                params: { storyId: 'story1', chapterId: 'nonexistent' },
            }

            await expect(
                chapterController.getChapterById(request as any, reply as any)
            ).rejects.toThrow(NotFoundError)
            expect(chapterStoryService.getChapterById).toHaveBeenCalledWith(
                'nonexistent'
            )
        })
    })

    describe('createProposeChapter', () => {
        it('должен создавать предложение, если пользователь авторизован', async () => {
            const proposalData = {
                id: 'proposal1',
                title: 'New Chapter',
                content: 'Content',
            }
            ;(proposalService.createProposeChapter as any).mockResolvedValue(
                proposalData
            )

            request = {
                user: { userId: 'user1' },
                params: { storyId: 'story1', chapterId: 'chapter1' },
                body: { title: 'New Chapter', content: 'Content' },
            }

            await chapterController.createProposeChapter(
                request as any,
                reply as any
            )

            expect(proposalService.createProposeChapter).toHaveBeenCalledWith(
                'story1',
                'chapter1',
                'user1',
                'New Chapter',
                'Content'
            )
            expect(reply.code).toHaveBeenCalledWith(201)
            expect(reply.send).toHaveBeenCalledWith(proposalData)
        })

        it('должен выбрасывать ошибку, если пользователь не авторизован', async () => {
            request = {
                user: null,
                params: { storyId: 'story1', chapterId: 'chapter1' },
                body: { title: 'New Chapter', content: 'Content' },
            }

            await expect(
                chapterController.createProposeChapter(
                    request as any,
                    reply as any
                )
            ).rejects.toThrow(UnauthorizedError)
            expect(proposalService.createProposeChapter).not.toHaveBeenCalled()
        })
    })

    describe('getProposals', () => {
        it('должен возвращать список предложений с пагинацией', async () => {
            const paginationResult = {
                items: [{ id: 'proposal1', title: 'Proposal 1' }],
                totalCount: 1,
                totalPages: 1,
                page: 1,
                pageSize: 10,
            }
            ;(proposalService.getProposalsPaginated as any).mockResolvedValue(
                paginationResult
            )

            request = {
                params: { storyId: 'story1', chapterId: 'chapter1' },
                query: { page: 2, pageSize: 5 },
            }

            await chapterController.getProposals(request as any, reply as any)

            expect(proposalService.getProposalsPaginated).toHaveBeenCalledWith(
                'story1',
                'chapter1',
                2,
                5
            )
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith(paginationResult)
        })

        it('должен использовать значения по умолчанию для параметров пагинации', async () => {
            const paginationResult = {
                items: [{ id: 'proposal1', title: 'Proposal 1' }],
                totalCount: 1,
                totalPages: 1,
                page: 1,
                pageSize: 10,
            }
            ;(proposalService.getProposalsPaginated as any).mockResolvedValue(
                paginationResult
            )

            request = {
                params: { storyId: 'story1', chapterId: 'chapter1' },
                query: {},
            }

            await chapterController.getProposals(request as any, reply as any)

            expect(proposalService.getProposalsPaginated).toHaveBeenCalledWith(
                'story1',
                'chapter1',
                1,
                10
            )
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith(paginationResult)
        })
    })

    describe('getProposalById', () => {
        it('должен возвращать предложение по ID', async () => {
            const proposalData = { id: 'proposal1', title: 'Proposal 1' }
            ;(proposalService.getProposalById as any).mockResolvedValue(
                proposalData
            )

            request = {
                params: {
                    storyId: 'story1',
                    chapterId: 'chapter1',
                    proposalId: 'proposal1',
                },
            }

            await chapterController.getProposalById(
                request as any,
                reply as any
            )

            expect(proposalService.getProposalById).toHaveBeenCalledWith(
                'proposal1'
            )
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith(proposalData)
        })

        it('должен обработать ошибку, если предложение не найдено', async () => {
            ;(proposalService.getProposalById as any).mockResolvedValue(null)

            request = {
                params: {
                    storyId: 'story1',
                    chapterId: 'chapter1',
                    proposalId: 'nonexistent',
                },
            }

            await expect(
                chapterController.getProposalById(request as any, reply as any)
            ).rejects.toThrow(NotFoundError)
            expect(proposalService.getProposalById).toHaveBeenCalledWith(
                'nonexistent'
            )
        })
    })

    describe('voteProposal', () => {
        it('должен голосовать за предложение, если пользователь авторизован', async () => {
            const voteResult = { success: true }
            vi.mocked(proposalService.voteProposal).mockResolvedValue(
                voteResult
            )

            request = {
                user: { userId: 'user1' },
                params: { proposalId: 'proposal1' },
            }

            await chapterController.voteProposal(request as any, reply as any)

            expect(proposalService.voteProposal).toHaveBeenCalledWith(
                'proposal1',
                'user1'
            )
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith(voteResult)
        })

        it('должен выбрасывать ошибку, если пользователь не авторизован', async () => {
            request = {
                user: null,
                params: { proposalId: 'proposal1' },
            }

            await expect(
                chapterController.voteProposal(request as any, reply as any)
            ).rejects.toThrow(UnauthorizedError)
            expect(proposalService.voteProposal).not.toHaveBeenCalled()
        })
    })

    describe('deleteVoteProposal', () => {
        it('должен удалять голос, если пользователь авторизован', async () => {
            const voteResult = { success: true }
            vi.mocked(proposalService.deleteVoteProposal).mockResolvedValue(
                voteResult
            )

            request = {
                user: { userId: 'user1' },
                params: { proposalId: 'proposal1' },
            }

            await chapterController.deleteVoteProposal(
                request as any,
                reply as any
            )

            expect(proposalService.deleteVoteProposal).toHaveBeenCalledWith(
                'proposal1',
                'user1'
            )
            expect(reply.code).toHaveBeenCalledWith(204)
            expect(reply.send).toHaveBeenCalledWith(voteResult)
        })

        it('должен выбрасывать ошибку, если пользователь не авторизован', async () => {
            request = {
                user: null,
                params: { proposalId: 'proposal1' },
            }

            await expect(
                chapterController.deleteVoteProposal(
                    request as any,
                    reply as any
                )
            ).rejects.toThrow(UnauthorizedError)
            expect(proposalService.deleteVoteProposal).not.toHaveBeenCalled()
        })
    })

    describe('deleteProposalById', () => {
        it('должен удалять предложение, если пользователь авторизован', async () => {
            vi.mocked(proposalService.deleteProposal).mockResolvedValue({
                success: true,
            })

            request = {
                user: { userId: 'user1' },
                params: { storyId: 'story1', proposalId: 'proposal1' },
            }

            await chapterController.deleteProposalById(
                request as any,
                reply as any
            )

            expect(proposalService.deleteProposal).toHaveBeenCalledWith(
                'proposal1',
                'user1',
                'story1'
            )
            expect(reply.status).toHaveBeenCalledWith(204)
            expect(reply.send).toHaveBeenCalled()
        })

        it('должен выбрасывать ошибку, если пользователь не авторизован', async () => {
            request = {
                user: null,
                params: { storyId: 'story1', proposalId: 'proposal1' },
            }

            await expect(
                chapterController.deleteProposalById(
                    request as any,
                    reply as any
                )
            ).rejects.toThrow(UnauthorizedError)
            expect(proposalService.deleteProposal).not.toHaveBeenCalled()
        })
    })

    describe('changeProposalById', () => {
        it('должен изменять предложение, если пользователь авторизован', async () => {
            const updatedProposal = {
                id: 'proposal1',
                title: 'Updated Title',
                content: 'Updated Content',
            }
            ;(proposalService.changeProposal as any).mockResolvedValue(
                updatedProposal
            )

            request = {
                user: { userId: 'user1' },
                params: { storyId: 'story1', proposalId: 'proposal1' },
                body: { title: 'Updated Title', content: 'Updated Content' },
            }

            await chapterController.changeProposalById(
                request as any,
                reply as any
            )

            expect(proposalService.changeProposal).toHaveBeenCalledWith(
                'proposal1',
                'user1',
                'story1',
                'Updated Title',
                'Updated Content'
            )
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith(updatedProposal)
        })

        it('должен выбрасывать ошибку, если пользователь не авторизован', async () => {
            request = {
                user: null,
                params: { storyId: 'story1', proposalId: 'proposal1' },
                body: { title: 'Updated Title', content: 'Updated Content' },
            }

            await expect(
                chapterController.changeProposalById(
                    request as any,
                    reply as any
                )
            ).rejects.toThrow(UnauthorizedError)
            expect(proposalService.changeProposal).not.toHaveBeenCalled()
        })
    })

    describe('selectWinnerProposal', () => {
        it('должен выбирать победителя, если пользователь авторизован', async () => {
            ;(proposalService.selectWinnerProposal as any).mockResolvedValue({
                success: true,
            })

            request = {
                user: { userId: 'user1' },
                params: { proposalId: 'proposal1' },
            }

            await chapterController.selectWinnerProposal(
                request as any,
                reply as any
            )

            expect(proposalService.selectWinnerProposal).toHaveBeenCalledWith(
                'proposal1',
                'user1'
            )
            expect(reply.code).toHaveBeenCalledWith(200)
            expect(reply.send).toHaveBeenCalledWith({ success: true })
        })

        it('должен выбрасывать ошибку, если пользователь не авторизован', async () => {
            request = {
                user: null,
                params: { proposalId: 'proposal1' },
            }

            await expect(
                chapterController.selectWinnerProposal(
                    request as any,
                    reply as any
                )
            ).rejects.toThrow(UnauthorizedError)
            expect(proposalService.selectWinnerProposal).not.toHaveBeenCalled()
        })
    })
})
