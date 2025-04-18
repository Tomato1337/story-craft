import { TokenPayload } from 'storycraft-common-types'

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload
        }
    }
}
