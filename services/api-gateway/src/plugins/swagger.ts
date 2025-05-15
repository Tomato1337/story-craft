import fastifyPlugin from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { env, serviceConfig } from '../config'

export default fastifyPlugin(async (fastify: FastifyInstance) => {
    const fetchServiceSchema = async (serviceName, config) => {
        try {
            const response = await fetch(`${config.upstream}/schema`)

            if (!response.ok) {
                throw new Error(`Ошибка получения схемы от ${serviceName}`)
            }

            return await response.json()
        } catch (error) {
            fastify.log.error(
                `Не удалось получить схему от ${serviceName}: ${error.message}`
            )
            return null
        }
    }

    const buildCombinedSchema = async () => {
        const baseSchema = {
            openapi: '3.0.0',
            info: {
                title: 'StoryCraft API',
                description: 'Полная документация API для StoryCraft',
                version: '1.0.0',
            },
            paths: {},
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
                schemas: {},
                responses: {},
                parameters: {},
                examples: {},
                requestBodies: {},
                headers: {},
            },
            tags: [
                {
                    name: 'Auth',
                    description: 'Методы для работы с авторизацией',
                },
                {
                    name: 'Stories',
                    description: 'Методы для работы с историями',
                },
            ],
        }

        const serviceSchemas = {}
        const fetchPromises = Object.entries(serviceConfig)
            .filter(([_, config]) => config.swaggerEnabled)
            .map(async ([serviceName, config]) => {
                const schema = await fetchServiceSchema(serviceName, config)
                
                if (schema) {
                    serviceSchemas[serviceName] = schema
                }
            })

        await Promise.all(fetchPromises)

        for (const [serviceName, schema] of Object.entries(serviceSchemas)) {
            const config = serviceConfig[serviceName]
            const prefix = config.prefix || serviceName

            if (schema.tags) {
                for (const tag of schema.tags) {
                    if (!baseSchema.tags.some((t) => t.name === tag.name)) {
                        baseSchema.tags.push(tag)
                    }
                }
            }

            if (schema.paths) {
                for (const [path, pathData] of Object.entries(schema.paths)) {
                    const normalizedPath = path.startsWith('/')
                        ? `/${prefix}${path}`
                        : `/${prefix}/${path}`

                    const cleanedPath = normalizedPath.replace(/\/+/g, '/')
                    baseSchema.paths[cleanedPath] = pathData
                }
            }

            if (schema.components) {
                for (const componentType of [
                    'schemas',
                    'responses',
                    'parameters',
                    'examples',
                    'requestBodies',
                    'headers',
                    'links',
                    'callbacks',
                ]) {
                    if (schema.components[componentType]) {
                        baseSchema.components[componentType] = {
                            ...(baseSchema.components[componentType] || {}),
                            ...schema.components[componentType],
                        }
                    }
                }
            }
        }

        return baseSchema
    }

    await fastify.register(fastifySwagger, {
        mode: 'static',
        specification: {
            document: (await buildCombinedSchema()) as any,
        },
    })

    await fastify.register(fastifySwaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            persistAuthorization: true,
            deepLinking: false,
        },
        staticCSP: true,
    })

    fastify.get('/api-json', async (request, reply) => {
        const schema = await buildCombinedSchema()
        return schema
    })
})
