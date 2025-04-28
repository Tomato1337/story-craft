import { prisma } from '../lib/prisma'
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

        try {
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

            const hashedPassword = await hashPassword(password)
            if (!hashedPassword) {
                throw new InternalServerError('Failed to hash password')
            }

            const user = await prisma.user.create({
                data: {
                    email,
                    username,
                    avatarUrl: avatarUrl,
                    password: hashedPassword,
                },
            })

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
