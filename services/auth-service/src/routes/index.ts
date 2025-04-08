import { Router } from 'express'
import authRoutes from './auth.routes'

const router = Router()

router.use('/', authRoutes)

router.get('/health', (req, res) => {
    console.log(req.headers['x-user-object'])
    res.status(200).json({
        status: 'ok',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
    })
})

export default router
