import { FastifyError, FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { AppError } from '../utils/errors'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import {
    hasZodFastifySchemaValidationErrors,
    isResponseSerializationError,
} from 'fastify-type-provider-zod'
import { env } from '../config'

export default fp(async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((error: FastifyError, request, reply) => {
        fastify.log.error(error)

        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                error: error.constructor.name,
                message: error.message,
                statusCode: error.statusCode,
            })
        }

        if (hasZodFastifySchemaValidationErrors(error)) {
            return reply.status(400).send({
                error: 'ValidationError',
                message: error.message,
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

        if (error instanceof PrismaClientKnownRequestError) {
            let statusCode = 500
            let message = 'Ошибка базы данных'

            switch (error.code) {
                case 'P2001': // Запись не найдена
                case 'P2025': // Запись не найдена или условное ограничение не выполнено
                    statusCode = 404
                    message = 'Запрашиваемый ресурс не найден'
                    break
                case 'P2002': // Уникальное ограничение нарушено
                    statusCode = 409
                    message = 'Ресурс с такими данными уже существует'
                    break
                case 'P2003': // Нарушение ограничения внешнего ключа
                    statusCode = 400
                    message = 'Ссылка на несуществующий ресурс'
                    break
                case 'P2014': // Нарушение ограничения отношения
                    statusCode = 400
                    message = 'Некорректная связь между ресурсами'
                    break
            }

            return reply.status(statusCode).send({
                error: 'DatabaseError',
                code: error.code,
                message,
                statusCode,
            })
        }

        const statusCode = error.statusCode || error?.status || 500

        const errorResponse = {
            error: error.name || 'InternalServerError',
            message: error.message || 'Внутренняя ошибка сервера',
            statusCode: statusCode,
            ...(env.NODE_ENV === 'prod' ? {} : { stack: error.stack }),
        }

        reply.status(statusCode).send(errorResponse)
    })
})
