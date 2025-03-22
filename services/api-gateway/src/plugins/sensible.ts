import fastifyPlugin from 'fastify-plugin'
import fastifySensible from '@fastify/sensible'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

const sensiblePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    await fastify.register(fastifySensible)

    fastify.setErrorHandler((error, request, reply) => {
        fastify.log.error(error)
        return reply.send(error)
    })
}

export default fastifyPlugin(sensiblePlugin)
