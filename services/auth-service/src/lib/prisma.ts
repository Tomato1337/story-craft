import { PrismaClient } from '@prisma/client'
import config from '../config'

declare global {
    var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()
if (config.nodeEnv === 'dev') {
    global.prisma = prisma
}
