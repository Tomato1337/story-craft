import { prisma } from '../lib/prisma'
import config from '../config'
import {
    hashPassword,
    comparePassword,
    createAccessToken,
    createRefreshToken,
    revokeRefreshToken,
    verifyRefreshToken,
} from '../lib/auth'
import {
    BadRequestError,
    ConflictError,
    NotFoundError,
    UnauthorizedError,
    InternalServerError,
} from '../utils/errors'
import { AppError } from '../utils/errors'
import { Prisma } from '@prisma/client'

export class AuthService {
    async register(userData: {
        email: string
        password: string
        username: string
        avatarUrl?: string
    }) {
        const { email, password, username, avatarUrl } = userData
        let createdUser = null

        try {
            // 1. Сначала проверим существование пользователя
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [{ email }, { username }],
                },
            })

            if (existingUser) {
                throw new ConflictError(
                    'User with this email or username already exists'
                )
            }

            // 2. Создаем пользователя в auth-service
            const hashedPassword = await hashPassword(password)
            if (!hashedPassword) {
                throw new InternalServerError('Failed to hash password')
            }

            createdUser = await prisma.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword,
                },
            })

            // 3. Создаем токены
            const accessToken = createAccessToken({
                userId: createdUser.id,
            })
            const refreshToken = await createRefreshToken(createdUser.id)

            // 4. Создаем профиль в user-profile-service
            try {
                const URL = `http://${
                    config.nodeEnv === 'dev' ? 'api-gateway-dev' : 'api-gateway'
                }:${config.apiGatewayPort}/users/profiles`
                console.log(URL)
                const response = await fetch(URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        userId: createdUser.id,
                        email: createdUser.email,
                        username: createdUser.username,
                        role: createdUser.role,
                        avatarUrl: avatarUrl || null,
                    }),
                })

                if (!response.ok) {
                    // Если запрос выполнен, но сервер вернул ошибку
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(
                        `Ошибка создания профиля: ${
                            response.status
                        } ${JSON.stringify(errorData)}`
                    )
                }
            } catch (err) {
                console.log('Ошибка создания профиля:', err)

                // КОМПЕНСИРУЮЩЕЕ ДЕЙСТВИЕ: удаляем созданного пользователя
                if (createdUser) {
                    console.log(
                        `Откат: удаление пользователя ${createdUser.id} из-за ошибки создания профиля`
                    )
                    await prisma.user.delete({
                        where: { id: createdUser.id },
                    })
                }

                throw new Error(
                    `Ошибка создания профиля в user-profile-service: ${err}`
                )
            }

            // 5. Возвращаем результат
            return {
                user: {
                    id: createdUser.id,
                    email: createdUser.email,
                    username: createdUser.username,
                    role: createdUser.role,
                },
                tokens: {
                    accessToken,
                    refreshToken,
                },
            }
        } catch (error) {
            // Обработка всех остальных ошибок
            if (error instanceof AppError) {
                throw error
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictError(
                        'User with this information already exists'
                    )
                }
            }

            console.error('Registration error:', error)
            throw new InternalServerError('Failed to register user')
        }
    }

    async login(credentials: { email: string; password: string }) {
        const { email, password } = credentials

        try {
            const user = await prisma.user.findUnique({
                where: { email },
            })

            if (!user) {
                throw new UnauthorizedError('Invalid email or password')
            }

            const isPasswordValid = await comparePassword(
                password,
                user.password
            )
            if (!isPasswordValid) {
                throw new UnauthorizedError('Invalid email or password')
            }

            const accessToken = createAccessToken({
                userId: user.id,
            })

            const refreshToken = await createRefreshToken(user.id)

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                },
                tokens: {
                    accessToken,
                    refreshToken,
                },
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error
            }
            console.error('Login error:', error)
            throw new InternalServerError('Failed to log in')
        }
    }

    async logout(token: string) {
        try {
            if (!token) {
                throw new BadRequestError('Refresh token is required')
            }

            const tokenRecord = await prisma.refreshToken.findUnique({
                where: { token },
            })

            if (!tokenRecord) {
                throw new NotFoundError('Refresh token not found')
            }

            await revokeRefreshToken(token)
            return { success: true }
        } catch (error) {
            if (error instanceof AppError) {
                throw error
            }
            console.error('Logout error:', error)
            throw new InternalServerError('Failed to log out')
        }
    }

    async refreshTokens(token: string) {
        try {
            if (!token) {
                throw new BadRequestError('Refresh token is required')
            }

            const payload = await verifyRefreshToken(token)

            if (!payload) {
                throw new UnauthorizedError('Invalid or expired refresh token')
            }

            await revokeRefreshToken(token, 'Token refreshed')

            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
            })

            if (!user) {
                throw new NotFoundError('User not found')
            }

            const accessToken = createAccessToken({
                userId: user.id,
            })

            const refreshToken = await createRefreshToken(user.id)

            return {
                tokens: {
                    accessToken,
                    refreshToken,
                },
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error
            }
            console.error('Token refresh error:', error)
            throw new InternalServerError('Failed to refresh tokens')
        }
    }
}

export default new AuthService()
