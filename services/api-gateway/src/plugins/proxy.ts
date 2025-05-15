import fastifyPlugin from 'fastify-plugin'
import httpProxy from '@fastify/http-proxy'
import { serviceConfig, commonProxyOptions } from '../config'
import { FastifyInstance } from 'fastify'
import { TokenPayload } from 'storycraft-common-types'

export default fastifyPlugin(async (fastify: FastifyInstance) => {
    // Добавляем заголовок x-user-object в запросы к проксируемым сервисам для аутентификации

    fastify.addHook('onRequest', async (request, reply) => {
        try {
            if (request.headers.authorization) {
                const token = request.headers.authorization.split(' ')[1]
                const res = (await fastify.jwt.decode(token)) as TokenPayload

                if (res) {
                    request.headers['x-user-object'] = JSON.stringify(res)
                }
            }
        } catch (err) {
            fastify.log.error(`Error decoding token: ${err.message}`)
        }
    })

    for (const [serviceName, config] of Object.entries(serviceConfig)) {
        fastify.log.info(
            `Setting up proxy for ${serviceName} at ${config.prefix} -> ${config.upstream}`
        )

        await fastify.register(httpProxy, {
            upstream: config.upstream,
            prefix: config.prefix,
            ...commonProxyOptions,
        })
    }
})
