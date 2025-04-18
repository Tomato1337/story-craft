import { FastifyReply, FastifyRequest } from 'fastify'
import { proposalService } from '../services/proposal.service'
import { chapterStoryService } from '../services/chapter.service'
import {
    chapterResponseSchema,
    proposeChapterSchema,
    proposalResponseSchema,
    voteResponseSchema,
} from '../model/chapter.model'
import { CreateChapterInput, ProposeChapterInput } from '../model/chapter.model'

export const chapterController = {
    // Получение всех глав истории
    async getChapters(
        request: FastifyRequest<{ Params: { storyId: string } }>,
        reply: FastifyReply
    ) {
        const { storyId } = request.params
        // Получаем главу через отдельный сервис
        const chapters = await chapterStoryService.getChapters(storyId)
        return reply.code(200).send(chapters)
    },

    // Предложение новой главы
    async proposeChapter(
        request: FastifyRequest<{
            Params: { storyId: string; chapterId: string }
            Body: ProposeChapterInput
        }>,
        reply: FastifyReply
    ) {
        const { storyId, chapterId } = request.params
        const data = request.body
        try {
            const proposal = await proposalService.proposeChapter(
                storyId,
                chapterId,
                request.user!.userId,
                data.title,
                data.content
            )
            return reply.code(201).send(proposal)
        } catch (err: any) {
            return reply.status(400).send({ error: err.message })
        }
    },

    // Получение всех предложений для главы
    async getProposals(
        request: FastifyRequest<{
            Params: { storyId: string; chapterId: string }
        }>,
        reply: FastifyReply
    ) {
        const { storyId, chapterId } = request.params
        const proposals = await proposalService.getProposals(storyId, chapterId)
        return reply.code(200).send(proposals)
    },

    // Голос за предложение
    async voteProposal(
        request: FastifyRequest<{ Params: { proposalId: string } }>,
        reply: FastifyReply
    ) {
        const { proposalId } = request.params
        try {
            const result = await proposalService.voteProposal(
                proposalId,
                request.user!.userId
            )
            return reply.code(200).send(result)
        } catch (err: any) {
            return reply.status(400).send({ error: err.message })
        }
    },
}
