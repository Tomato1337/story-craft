import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

export const validateRequest =
    (schema: z.ZodObject<any, any>) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body)
            next()
        } catch (error) {
            next(error)
        }
    }
