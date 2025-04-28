import { FastifyReply, FastifyRequest } from 'fastify'
import { proposalService } from '../services/proposal.service'
import { chapterStoryService } from '../services/chapter.service'
import { ProposeChapterInput } from '../model/chapter.model'
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from '../utils/errors'

export const chapterController = {
    async getChapters(
        request: FastifyRequest<{
            Params: { storyId: string }
            Querystring: { page?: number; pageSize?: number }
        }>,
        reply: FastifyReply
    ) {
        const { storyId } = request.params
        const { page = 1, pageSize = 10 } = request.query
        const result = await chapterStoryService.getChaptersPaginated(
            storyId,
            page,
            pageSize
        )
        return reply.code(200).send(result)
    },

    async getChapterById(
        request: FastifyRequest<{
            Params: { storyId: string; chapterId: string }
        }>,
        reply: FastifyReply
    ) {
        const { chapterId } = request.params
        const result = await chapterStoryService.getChapterById(chapterId)

        if (!result) {
            throw new NotFoundError(`Глава с ID ${chapterId} не найдена`)
        }

        return reply.code(200).send(result)
    },

    async createProposeChapter(
        request: FastifyRequest<{
            Params: { storyId: string; chapterId: string }
            Body: ProposeChapterInput
        }>,
        reply: FastifyReply
    ) {
        if (!request.user) {
            throw new UnauthorizedError(
                'Требуется авторизация для создания предложения'
            )
        }

        const { storyId, chapterId } = request.params
        const data = request.body

        const proposal = await proposalService.createProposeChapter(
            storyId,
            chapterId,
            request.user.userId,
            data.title,
            data.content
        )

        return reply.code(201).send(proposal)
    },

    async getProposals(
        request: FastifyRequest<{
            Params: { storyId: string; chapterId: string }
            Querystring: { page?: number; pageSize?: number }
        }>,
        reply: FastifyReply
    ) {
        const { storyId, chapterId } = request.params
        const { page = 1, pageSize = 10 } = request.query
        const result = await proposalService.getProposalsPaginated(
            storyId,
            chapterId,
            page,
            pageSize
        )
        return reply.code(200).send(result)
    },

    async getProposalById(
        request: FastifyRequest<{
            Params: { storyId: string; chapterId: string; proposalId: string }
        }>,
        reply: FastifyReply
    ) {
        const { proposalId } = request.params
        const result = await proposalService.getProposalById(proposalId)

        if (!result) {
            throw new NotFoundError(`Предложение с ID ${proposalId} не найдено`)
        }

        return reply.code(200).send(result)
    },

    async voteProposal(
        request: FastifyRequest<{ Params: { proposalId: string } }>,
        reply: FastifyReply
    ) {
        if (!request.user) {
            throw new UnauthorizedError('Требуется авторизация для голосования')
        }

        const { proposalId } = request.params
        const result = await proposalService.voteProposal(
            proposalId,
            request.user.userId
        )

        return reply.code(200).send(result)
    },

    async deleteVoteProposal(
        request: FastifyRequest<{ Params: { proposalId: string } }>,
        reply: FastifyReply
    ) {
        if (!request.user) {
            throw new UnauthorizedError(
                'Требуется авторизация для отмены голоса'
            )
        }

        const { proposalId } = request.params
        const result = await proposalService.deleteVoteProposal(
            proposalId,
            request.user.userId
        )

        return reply.code(204).send(result)
    },

    async deleteProposalById(
        request: FastifyRequest<{
            Params: { storyId: string; chapterId: string; proposalId: string }
        }>,
        reply: FastifyReply
    ) {
        if (!request.user) {
            throw new UnauthorizedError(
                'Требуется авторизация для удаления предложения'
            )
        }

        const { storyId, proposalId } = request.params
        await proposalService.deleteProposal(
            proposalId,
            request.user.userId,
            storyId
        )

        return reply.status(204).send()
    },

    async changeProposalById(
        request: FastifyRequest<{
            Params: { storyId: string; chapterId: string; proposalId: string }
            Body: ProposeChapterInput
        }>,
        reply: FastifyReply
    ) {
        if (!request.user) {
            throw new UnauthorizedError(
                'Требуется авторизация для изменения предложения'
            )
        }

        const { storyId, proposalId } = request.params
        const data = request.body

        const proposal = await proposalService.changeProposal(
            proposalId,
            request.user.userId,
            storyId,
            data.title,
            data.content
        )

        return reply.code(200).send(proposal)
    },

    async selectWinnerProposal(
        request: FastifyRequest<{
            Params: { proposalId: string }
        }>,
        reply: FastifyReply
    ) {
        if (!request.user) {
            throw new UnauthorizedError(
                'Требуется авторизация для выбора победителя'
            )
        }

        const { proposalId } = request.params
        const result = await proposalService.selectWinnerProposal(
            proposalId,
            request.user.userId
        )

        return reply.code(200).send(result)
    },
}
