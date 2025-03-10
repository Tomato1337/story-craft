import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import methodOverride from 'method-override'
import 'dotenv/config'
import config from './config'
import routes from './routes'
import { errorHandler } from './middlewares'

class ExpressServer {
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
        this.app.use('/api', routes)

        this.app.use('*', (req, res) => {
            res.status(404).json({ message: 'Route not found' })
        })

        // ??? Typescript почему-то не понимает, что это middleware express для обработки ошибок
        this.app.use(errorHandler as any as express.ErrorRequestHandler)
    }
}

export default ExpressServer
