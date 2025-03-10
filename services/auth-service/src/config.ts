interface Config {
    port: number
    nodeEnv: string
    jwtSecret: string
    jwtAccessTokenExpiresIn: number
    jwtRefreshTokenExpiresIn: number
    logLevel: string
    database: {
        url: string
    }
}

const getConfig = (): Config => {
    return {
        port: getEnvNumber('PORT', 3001),
        nodeEnv: getEnvString('NODE_ENV', 'dev'),
        logLevel: getEnvString('LOG_LEVEL', 'info'),
        jwtAccessTokenExpiresIn: getEnvNumber('JWT_ACCESS_EXPIRES', 15 * 60),
        jwtRefreshTokenExpiresIn: getEnvNumber(
            'JWT_REFRESH_EXPIRES',
            7 * 24 * 60 * 60
        ),
        jwtSecret: getEnvString('JWT_SECRET'),
        database: {
            url: getEnvString('DATABASE_URL'),
        },
    }
}

const getEnvString = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue
    if (value === undefined) {
        throw new Error(`Environment variable ${key} is not set`)
    }
    return value
}

const getEnvNumber = (key: string, defaultValue?: number): number => {
    const stringValue = process.env[key]
    if (stringValue === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue
        }
        throw new Error(`Environment variable ${key} is not set`)
    }

    const numValue = Number(stringValue)
    if (isNaN(numValue)) {
        throw new Error(`Environment variable ${key} is not a number`)
    }

    return numValue
}

const config = getConfig()

export default config
