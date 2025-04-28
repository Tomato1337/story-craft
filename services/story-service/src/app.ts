import fastify from 'fastify'
import { env } from './config'
import closeWithGrace from 'close-with-grace'
import fastifySwagger from '@fastify/swagger'
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'
import { routes } from './routes'
import authenticate from './plugins/authenticate'
import errorHandler from './plugins/error-handler'

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

export const app = fastify(settingsFastify)

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(errorHandler)

app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Story Service API',
            description: 'API для работы с историями, главами и жанрами',
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    transform: jsonSchemaTransform,
})

app.register(authenticate)
app.register(routes)

const start = async () => {
    try {
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

// Запуск сервера, если не в режиме тестирования Vitest
if (!process.env.VITEST) {
    start()
}
