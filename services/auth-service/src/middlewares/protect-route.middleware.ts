import { verifyAccessToken } from '../lib/auth'
import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError } from '../utils/errors'

export const protectRoute = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const bearer = req.headers.authorization

        if (!bearer || !bearer.startsWith('Bearer ')) {
            throw new UnauthorizedError('No access token provided')
        }

        const token = bearer.split(' ')[1]
        const payload = verifyAccessToken(token)

        if (!payload) {
            throw new UnauthorizedError('Invalid or expired access token')
        }

        req.user = payload
        next()
    } catch (error) {
        next(error)
    }
}
