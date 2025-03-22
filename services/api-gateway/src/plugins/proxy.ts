import fastifyPlugin from 'fastify-plugin'
import httpProxy from '@fastify/http-proxy'
import { serviceConfig, commonProxyOptions } from '../config'
import { FastifyInstance } from 'fastify'

export default fastifyPlugin(async (fastify: FastifyInstance) => {
    for (const [serviceName, config] of Object.entries(serviceConfig)) {
        fastify.log.info(
            `Setting up proxy for ${serviceName} at ${config.prefix} -> ${config.upstream}`
        )

        fastify.addHook('onError', (request, reply, error) => {
            if (request.url.startsWith(config.prefix)) {
                fastify.log.error(
                    `Proxy error for ${serviceName}: ${error.message}`
                )
            }
        })

        await fastify.register(httpProxy, {
            upstream: config.upstream,
            prefix: config.prefix,
            ...commonProxyOptions,
        })
    }
})
