import { Router } from 'express'

const router = Router()

router.get('/profile', (req, res) => {
    res.status(200).json({ message: 'User profile' })
})

router.put('/profile', (req, res) => {
    res.status(200).json({ message: 'Profile updated' })
})

router.post('/password', (req, res) => {
    res.status(200).json({ message: 'Password changed' })
})

export default router
