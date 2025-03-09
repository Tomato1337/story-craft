interface Config {
    port: number
    nodeEnv: string
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
        database: {
            url: getEnvString(
                'DATABASE_URL',
                `postgresql://${getEnvString(
                    'DB_USER',
                    'storycraft_user'
                )}:${getEnvString(
                    'DB_PASSWORD',
                    'secure_password'
                )}@localhost:5432/storycraft_auth`
            ),
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
