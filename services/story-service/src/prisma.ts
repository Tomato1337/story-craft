import { PrismaClient, Role, Phase } from '@prisma/client'
import { env } from './config'

declare global {
    var prisma: PrismaClient | undefined
}
export const prisma = global.prisma || new PrismaClient()
if (env.NODE_ENV === 'dev') {
    global.prisma = prisma
}

export { Role, Phase }
