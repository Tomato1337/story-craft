import { ExpressServer } from './server'
import config from './config'

export const app = new ExpressServer().app
export const server = app.listen(config.port, () => {
    console.log(
        `Server listening on port ${config.port} in ${config.nodeEnv} mode`
    )
})
