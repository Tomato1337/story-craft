import { Router } from 'express'
import z from 'zod'
import { validateRequest, protectRoute } from '../middlewares'
import authService from '../services/auth.service'
import { Request, Response, NextFunction } from 'express'

const router = Router()

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
})

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    username: z.string().min(2, 'Username must be at least 2 characters long'),
})

const refreshTokenSchema = z.object({
    refreshToken: z.string().nonempty('Refresh token is required'),
})

router.post(
    '/login',
    validateRequest(loginSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body
            const result = await authService.login({ email, password })

            res.status(200).json({
                message: 'Login successful',
                ...result,
            })
        } catch (error) {
            next(error)
        }
    }
)

router.post(
    '/register',
    validateRequest(registerSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, username } = req.body
            const result = await authService.register({
                email,
                password,
                username,
            })

            res.status(201).json({
                message: 'User registered successfully',
                ...result,
            })
        } catch (error) {
            next(error)
        }
    }
)

router.post(
    '/logout',
    protectRoute,
    validateRequest(refreshTokenSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.body
            await authService.logout(refreshToken)

            res.status(200).json({ message: 'Logout successful' })
        } catch (error) {
            next(error)
        }
    }
)

router.post(
    '/refresh',
    validateRequest(refreshTokenSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.body
            const result = await authService.refreshTokens(refreshToken)

            res.status(200).json({
                message: 'Token refreshed',
                ...result,
            })
        } catch (error) {
            next(error)
        }
    }
)

export default router
