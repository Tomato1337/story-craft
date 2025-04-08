import z from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['dev', 'prod']).default('dev'),
    PORT: z.string().default('3000').transform(Number),
    PORT_AUTH_SERVICE: z.string().default('3001').transform(Number),
    PORT_STORY_SERVICE: z.string().default('3002').transform(Number),
    PORT_USER_SERVICE: z.string().default('3003').transform(Number),
    PORT_MEDIA_SERVICE: z.string().default('3004').transform(Number),
    PORT_SOCIAL_SERVICE: z.string().default('3005').transform(Number),
    JWT_SECRET: z.string().default('supersecret'),
    PORT_NOTIFICATION_SERVICE: z.string().default('3006').transform(Number),
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

const serviceConfigSchema = z.object({
    prefix: z.string().startsWith('/'),
    upstream: z.string().url(),
})

type ServiceConfig = z.infer<typeof serviceConfigSchema>

const validateServiceConfig = (
    config: Record<string, ServiceConfig>
): Record<string, ServiceConfig> => {
    Object.entries(config).forEach(([service, conf]) => {
        try {
            serviceConfigSchema.parse(conf)
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error(
                    `❌ Invalid configuration for ${service} service:`,
                    JSON.stringify(error.format(), null, 2)
                )
                process.exit(1)
            }
            throw error
        }
    })
    return config
}

const getServiceHost = (serviceName: string): string => {
    const suffix = env.NODE_ENV === 'dev' ? '-dev' : ''
    return `${serviceName}${suffix}`
}

export const serviceConfig = validateServiceConfig({
    auth: {
        prefix: '/auth',
        upstream: `http://${getServiceHost('auth-service')}:${
            env.PORT_AUTH_SERVICE
        }`,
    },
    user: {
        prefix: '/users',
        upstream: `http://${getServiceHost('user-profile-service')}:${
            env.PORT_USER_SERVICE
        }`,
    },
    story: {
        prefix: '/stories',
        upstream: `http://${getServiceHost('story-service')}:${
            env.PORT_STORY_SERVICE
        }`,
    },
    media: {
        prefix: '/media',
        upstream: `http://${getServiceHost('media-service')}:${
            env.PORT_MEDIA_SERVICE
        }`,
    },
    social: {
        prefix: '/social',
        upstream: `http://${getServiceHost('social-interaction-service')}:${
            env.PORT_SOCIAL_SERVICE
        }`,
    },
    notification: {
        prefix: '/notifications',
        upstream: `http://${getServiceHost('notification-service')}:${
            env.PORT_NOTIFICATION_SERVICE
        }`,
    },
})

export const commonProxyOptions = {
    rewritePrefix: '',
    httpMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    timeout: 5000,
}
