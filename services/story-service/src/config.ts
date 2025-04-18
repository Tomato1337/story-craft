import z from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['dev', 'prod']).default('dev'),
    PORT: z.string().default('3000').transform(Number),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .default('info'),
})

export const env = (() => {
    try {
        return envSchema.parse(process.env)
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error(
                '❌ Invalid environment variables:',
                JSON.stringify(error.format(), null, 2)
            )
            process.exit(1)
        }
        throw error
    }
})()
