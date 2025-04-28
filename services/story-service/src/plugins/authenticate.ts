import fp from 'fastify-plugin'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { TokenPayload } from 'storycraft-common-types'
import { UnauthorizedError } from '../utils/errors'

export default fp(async (app: FastifyInstance) => {
    app.decorateRequest('user', null)

    app.decorate(
        'authenticate',
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userObjectHeader = request.headers['x-user-object']
            if (!userObjectHeader) {
                throw new UnauthorizedError('Unauthorized')
            }

            try {
                const userObject: TokenPayload = JSON.parse(
                    userObjectHeader as string
                )

                if (!userObject || !userObject.userId) {
                    throw new UnauthorizedError('Invalid user data')
                }

                request.user = userObject

                app.log.info(`User authenticated: ${userObject.userId}`)
            } catch (error) {
                app.log.error(`Invalid user object: ${error.message}`)
                throw new UnauthorizedError('Invalid user data')
            }
        }
    )

    app.decorate(
        'authenticateOptional',
        async (request: FastifyRequest, reply: FastifyReply) => {
            const userObjectHeader = request.headers['x-user-object']

            if (!userObjectHeader) {
                app.log.info(
                    'No user authentication provided, continuing as guest'
                )
                return // Просто возвращаемся без установки request.user
            }

            try {
                const userObject: TokenPayload = JSON.parse(
                    userObjectHeader as string
                )

                if (userObject && userObject.userId) {
                    request.user = userObject
                    app.log.info(`User authenticated: ${userObject.userId}`)
                } else {
                    app.log.info('Invalid user data, continuing as guest')
                }
            } catch (error) {
                // В случае ошибки парсинга просто логируем и продолжаем без авторизации
                app.log.warn(`Could not parse user object: ${error.message}`)
            }
        }
    )
})
