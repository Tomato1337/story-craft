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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               username:
 *                 type: string
 *                 minLength: 3
 *               fullName:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 token:
 *                   type: string
 *       400:
 *         description: Некорректные данные для регистрации
 *       409:
 *         description: Пользователь с таким email или username уже существует
 */
router.post(
    '/register',
    validateRequest(registerSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, username, avatarUrl } = req.body
            const result = await authService.register({
                email,
                password,
                username,
                avatarUrl,
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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пользователь успешно авторизован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 token:
 *                   type: string
 *       400:
 *         description: Некорректные данные для авторизации
 *       401:
 *         description: Неверные учетные данные
 */
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

router.get('/is-auth', protectRoute, (req: Request, res: Response) => {
    res.status(200).json({ message: 'Authenticated', user: req.user })
})

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Выход пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный выход
 */
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

/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Обновление токенов
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Токены успешно обновлены
 */
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
