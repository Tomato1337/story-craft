import jwt, { Secret, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from './prisma'
import config from '../config'
import { InternalServerError, UnauthorizedError } from '../utils/errors'
import { TokenPayload } from '../types'

export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hash)
    } catch (error) {
        console.error('Error comparing passwords:', error)
        throw new InternalServerError('Error verifying password')
    }
}

export const hashPassword = async (password: string): Promise<string> => {
    try {
        return await bcrypt.hash(password, 10)
    } catch (error) {
        console.error('Error hashing password:', error)
        throw new InternalServerError('Error creating password hash')
    }
}

export const createAccessToken = (payload: TokenPayload): string => {
    try {
        return jwt.sign(payload, config.jwtSecret as Secret, {
            expiresIn: config.jwtAccessTokenExpiresIn,
        })
    } catch (error) {
        console.error('Error creating access token:', error)
        throw new InternalServerError('Failed to generate access token')
    }
}

export const createRefreshToken = async (userId: string): Promise<string> => {
    try {
        const tokenValue = uuidv4()
        const expiresAt = new Date()
        expiresAt.setSeconds(
            expiresAt.getSeconds() + config.jwtRefreshTokenExpiresIn
        )

        const refreshToken = await prisma.refreshToken.create({
            data: {
                token: tokenValue,
                userId,
                expiresAt,
            },
        })

        return refreshToken.token
    } catch (error) {
        console.error('Error creating refresh token:', error)
        throw new InternalServerError('Failed to generate refresh token')
    }
}

export const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, config.jwtSecret as Secret) as TokenPayload
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            console.warn('Access token expired')
            return null
        }
        if (error instanceof JsonWebTokenError) {
            console.warn('Invalid JWT token:', error.message)
            return null
        }
        console.error('JWT verification error:', error)
        return null
    }
}

export const verifyRefreshToken = async (token: string) => {
    try {
        // Проверяем токен в базе данных
        const refreshToken = await prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        })

        // Проверяем, существует ли токен и не отозван ли он
        if (!refreshToken) {
            throw new UnauthorizedError('Refresh token not found')
        }

        if (refreshToken.isRevoked) {
            throw new UnauthorizedError('Refresh token has been revoked')
        }

        // Проверяем срок действия
        if (new Date() > refreshToken.expiresAt) {
            throw new UnauthorizedError('Refresh token has expired')
        }

        return {
            userId: refreshToken.userId,
            email: refreshToken.user.email,
            role: refreshToken.user.role,
        }
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            throw error
        }
        console.error('Refresh token verification error:', error)
        throw new InternalServerError('Failed to verify refresh token')
    }
}

export const revokeRefreshToken = async (
    token: string,
    reason: string = 'User logout'
) => {
    try {
        await prisma.refreshToken.update({
            where: { token },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokedReason: reason,
            },
        })
    } catch (error) {
        console.error('Error revoking refresh token:', error)
        throw new InternalServerError('Failed to revoke refresh token')
    }
}
