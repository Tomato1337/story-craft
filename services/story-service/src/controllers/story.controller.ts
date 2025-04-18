import { FastifyReply, FastifyRequest } from 'fastify'
import { CreateStoryInput } from '../model/story.model'
import { storyService } from '../services/story.service'

export const storyController = {
    async createStory(
        request: FastifyRequest<{ Body: CreateStoryInput }>,
        reply: FastifyReply
    ) {
        console.log('Creating story', request.body)
        try {
            const story = await storyService.createStory(
                request.body,
                request.user!.userId
            )
            return reply.status(201).send(story)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: 'Internal Server Error' })
        }
    },
    async getStoryById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const storyId = request.params.id
            const story = await storyService.getStoryById(storyId)
            if (!story) {
                return reply.status(404).send({ error: 'Story not found' })
            }
            return reply.send(story)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: 'Internal Server Error' })
        }
    },
    async getAllStory(request: FastifyRequest, reply: FastifyReply) {
        try {
            const stories = await storyService.getAllStory()
            const response = {
                count: stories.length,
                stories,
            }
            return reply.send(response)
        } catch (error) {
            request.log.error(error)
            return reply.status(500).send({ error: 'Internal Server Error' })
        }
    },
}
