export class AppError extends Error {
    public statusCode: number
    public isOperational: boolean

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = true

        Error.captureStackTrace(this, this.constructor)
    }
}

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, 400)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
        super(message, 401)
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden') {
        super(message, 403)
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404)
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409)
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Something went wrong on the server') {
        super(message, 500)
    }
}
