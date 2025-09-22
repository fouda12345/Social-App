"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.UnAuthorizedError = exports.ConflictError = exports.BadRequestError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    constructor({ message = "Internal Server Error", options, statusCode = 500, } = {}) {
        super(message, options);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor({ message = "Not Found", options, statusCode = 404, } = {}) {
        super({ message, options, statusCode });
    }
}
exports.NotFoundError = NotFoundError;
class BadRequestError extends AppError {
    constructor({ message = "Bad Request", options, statusCode = 400, } = {}) {
        super({ message, options, statusCode });
    }
}
exports.BadRequestError = BadRequestError;
class ConflictError extends AppError {
    constructor({ message = "Conflict Error", options, statusCode = 409, } = {}) {
        super({ message, options, statusCode });
    }
}
exports.ConflictError = ConflictError;
class UnAuthorizedError extends AppError {
    constructor({ message = "Invalid credentials", options, statusCode = 401, } = {}) {
        super({ message, options, statusCode });
    }
}
exports.UnAuthorizedError = UnAuthorizedError;
const errorHandler = (err, req, res, next) => {
    return res.status(Number(err.statusCode) || 500).json({
        message: err.message,
        stack: process.env.MODE === 'DEV' ? err.stack : undefined,
        cause: err.cause
    });
};
exports.errorHandler = errorHandler;
