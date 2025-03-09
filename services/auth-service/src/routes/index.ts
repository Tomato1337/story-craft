import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
    })
})

export default router
