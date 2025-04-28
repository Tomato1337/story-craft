import { defineConfig } from '@playwright/test'
import { env } from './src/config.ts'

export default defineConfig({
    testDir: './tests/integration',
    timeout: 30000,
    reporter: 'html',
    use: {
        baseURL: `http://localhost:${env.PORT}`,
        extraHTTPHeaders: {
            // Добавляем заголовок для отладки
            'X-Integration-Test': 'true',
        },
        trace: 'on',
    },
    projects: [
        {
            name: 'api',
            testMatch: /.*\.api\.spec\.ts/,
        },
    ],
})
