import fp from 'fastify-plugin'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { TokenPayload } from 'storycraft-common-types'

export default fp(async (app: FastifyInstance) => {
    app.decorateRequest('user', null)

    app.decorate(
        'authenticate',
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userObjectHeader = request.headers['x-user-object']
            if (!userObjectHeader) {
                reply.status(401).send({ error: 'Unauthorized' })
                return
            }

            try {
                // Безопасное преобразование строки в объект с типом из общего пакета
                const userObject: TokenPayload = JSON.parse(
                    userObjectHeader as string
                )
                request.user = userObject

                app.log.info(`User authenticated: ${userObject.userId}`)
            } catch (error) {
                app.log.error(`Invalid user object: ${error.message}`)
                reply.status(401).send({ error: 'Invalid user data' })
                return
            }
        }
    )
})
