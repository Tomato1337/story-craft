import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import methodOverride from 'method-override'
import 'dotenv/config'
import config from './config'
import routes from './routes'

export class ExpressServer {
    public app: express.Application

    constructor() {
        this.app = express()
        this.config()
        this.routes()
    }

    public config() {
        this.app.use(express.json())
        this.app.use(express.urlencoded({ extended: true }))
        this.app.use(morgan(config.nodeEnv === 'dev' ? 'dev' : 'combined'))
        this.app.use(helmet())
        this.app.use(cors())
        this.app.use(compression())
        this.app.use(methodOverride())
    }

    public routes() {
        // Базовый путь API
        this.app.use('/api', routes)

        // Обработка 404 ошибок
        this.app.use('*', (req, res) => {
            res.status(404).json({ message: 'Route not found' })
        })
    }
}
