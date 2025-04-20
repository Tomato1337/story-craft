import fastify from 'fastify'
import { env } from './config'
import closeWithGrace from 'close-with-grace'
import {
    hasZodFastifySchemaValidationErrors,
    isResponseSerializationError,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyCompress from '@fastify/compress'
import { routes } from './routes'
import authenticate from './plugins/authenticate'

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
        app.setValidatorCompiler(validatorCompiler)
        app.setSerializerCompiler(serializerCompiler)

        await app.register(fastifyCors)
        await app.register(fastifyHelmet)
        await app.register(fastifyCompress)

        app.register(authenticate)
        app.register(routes)

        app.setErrorHandler((error, request, reply) => {
            app.log.error(error)

            if (hasZodFastifySchemaValidationErrors(error)) {
                return reply.code(400).send({
                    error: 'Response Validation Error',
                    message: "Request doesn't match the schema",
                    statusCode: 400,
                    details: {
                        issues: error.validation,
                        method: request.method,
                        url: request.url,
                    },
                })
            }

            if (isResponseSerializationError(error)) {
                return reply.code(500).send({
                    error: 'Internal Server Error',
                    message: "Response doesn't match the schema",
                    statusCode: 500,
                    details: {
                        issues: error.cause.issues,
                        method: error.method,
                        url: error.url,
                    },
                })
            }

            const statusCode = error.statusCode || 500

            return reply.status(statusCode).send({
                statusCode,
                error: 'Internal Server Error',
                message: error.message,
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
