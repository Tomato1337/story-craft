import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors'
import config from '../config'

const formatZodError = (error: ZodError) => {
    return {
        message: 'Validation error',
        errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        })),
    }
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', err)

    if (err instanceof ZodError) {
        return res.status(400).json(formatZodError(err))
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message,
            ...(config.nodeEnv === 'dev' ? { stack: err.stack } : {}),
        })
    }

    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any
        if (prismaError.code === 'P2002') {
            return res.status(409).json({
                message: 'Resource already exists',
                fields: prismaError.meta?.target || [],
            })
        }
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' })
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' })
    }

    const statusCode = 500
    const message =
        config.nodeEnv === 'production'
            ? 'Something went wrong'
            : err.message || 'Internal server error'

    return res.status(statusCode).json({
        message,
        ...(config.nodeEnv === 'dev' ? { stack: err.stack } : {}),
    })
}
