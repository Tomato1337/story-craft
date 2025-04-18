export interface TokenPayload {
    userId: string
    email: string
    role: string
    iat: number // issued at
    exp: number // expiration time
}
