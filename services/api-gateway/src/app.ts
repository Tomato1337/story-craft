import fastify from 'fastify'
import plugins from './plugins'
import { env } from './config'
import closeWithGrace from 'close-with-grace'

const settingsFastify = {
    logger: {
        level: env.LOG_LEVEL,
        ...(env.NODE_ENV === 'dev' && {
            transport: {
                target: 'pino-pretty',
            },
        }),
    },
    trustProxy: true,
}

const app = fastify(settingsFastify)

const start = async () => {
    try {
        await app.register(plugins.sensible)
        await app.register(plugins.proxy)

        app.get('/health', async () => {
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                environment: env.NODE_ENV,
            }
        })

        app.setNotFoundHandler((request, reply) => {
            reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: `Route ${request.method}:${request.url} not found`,
            })
        })

        await app.listen({ port: env.PORT, host: env.HOST })
        app.log.info(
            `API Gateway server running at ${env.HOST}:${env.PORT} in ${env.NODE_ENV} mode`
        )
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

closeWithGrace(async ({ signal, err, manual }) => {
    if (err) {
        app.log.error(err)
    }
    app.log.info(`Closing app with ${signal}`)
    await app.close()
    if (manual) {
        process.exit(0)
    }
})

start()
