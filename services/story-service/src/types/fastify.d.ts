import { TokenPayload } from 'storycraft-common-types'

declare module 'fastify' {
    interface FastifyRequest {
        user: TokenPayload | null
    }

    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => void
        authenticateOptional: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => void
    }
}
