import { Router } from 'express'
import authRoutes from './auth.routes'
import swaggerJSDoc from 'swagger-jsdoc'
import config from '../config'

const router = Router()

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Auth Service API',
            description: 'API документация для Auth Service',
            version: '1.0.0',
        },
    },
    apis: ['./src/routes/*.ts'], // Путь к роутам с JSDoc комментариями
}

const swaggerSpec = swaggerJSDoc(swaggerOptions)

router.use('/', authRoutes)

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
    })
})

router.get('/schema', (req, res) => {
    res.json(swaggerSpec)
})

export default router
