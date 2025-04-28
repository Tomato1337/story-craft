export class AppError extends Error {
    statusCode: number
    isOperational: boolean

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = true

        Error.captureStackTrace(this, this.constructor)
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Некорректные данные запроса') {
        super(message, 400)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Необходима авторизация') {
        super(message, 401)
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Доступ запрещен') {
        super(message, 403)
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Ресурс не найден') {
        super(message, 404)
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Конфликт данных') {
        super(message, 409)
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Внутренняя ошибка сервера') {
        super(message, 500)
    }
}
