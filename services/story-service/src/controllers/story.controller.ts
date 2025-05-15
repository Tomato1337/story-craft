import { FastifyReply, FastifyRequest } from 'fastify'
import { ChangeStoryInput, CreateStoryInput } from '../model/story.model'
import { storyService } from '../services/story.service'

export const storyController = {
    async createStory(
        request: FastifyRequest<{ Body: CreateStoryInput }>,
        reply: FastifyReply
    ) {
        const story = await storyService.createStory(
            request.body,
            request.user!.userId
        )

        return reply.status(201).send(story)
    },

    async getStoryById(
        request: FastifyRequest<{ Params: { storyId: string } }>,
        reply: FastifyReply
    ) {
        const storyId = request.params.storyId
        const story = await storyService.getStoryById(storyId)

        return reply.send(story)
    },

    async updateStoryById(
        request: FastifyRequest<{
            Params: { storyId: string }
            Body: ChangeStoryInput
        }>,
        reply: FastifyReply
    ) {
        const storyId = request.params.storyId
        const updatedStory = await storyService.updateStory(
            storyId,
            request.body,
            request.user!.userId
        )

        return reply.send(updatedStory)
    },

    async getMyStories(
        request: FastifyRequest<{
            Querystring: { page?: number; pageSize?: number }
        }>,
        reply: FastifyReply
    ) {
        const stories = await storyService.getMyStoriesPaginated(
            request.user!.userId,
            request.query.page,
            request.query.pageSize
        )

        return reply.send(stories)
    },

    async deleteStoryById(
        request: FastifyRequest<{ Params: { storyId: string } }>,
        reply: FastifyReply
    ) {
        const storyId = request.params.storyId
        await storyService.deleteStory(storyId, request.user!.userId)

        return reply.status(204).send({
            success: true,
        })
    },

    async getAllStory(
        request: FastifyRequest<{
            Querystring: { page?: number; pageSize?: number }
        }>,
        reply: FastifyReply
    ) {
        const { page = 1, pageSize = 10 } = request.query
        const result = await storyService.getStoriesPaginated(
            page,
            pageSize,
            request.user?.userId
        )

        return reply.code(200).send(result)
    },
}
