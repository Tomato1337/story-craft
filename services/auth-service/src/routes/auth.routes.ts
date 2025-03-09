import { Router } from 'express'

const router = Router()

router.post('/login', (req, res) => {
    res.status(200).json({ message: 'Login successful' })
})

router.post('/register', (req, res) => {
    res.status(201).json({ message: 'User registered successfully' })
})

router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful' })
})

router.post('/refresh', (req, res) => {
    res.status(200).json({ message: 'Token refreshed' })
})

export default router
