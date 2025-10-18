import { NextFunction, Request, Response } from "express";

export interface IError extends Error {
    statusCode: number
}

export interface IErrorConstructor {
    message?: string,
    options?: ErrorOptions|undefined,
    statusCode?: number
}

export class AppError extends Error {
    public statusCode: number
    constructor(
        {
            message = "Internal Server Error",
            options,
            statusCode = 500,
        } : IErrorConstructor = {}
    ) {
        super(message, options)
        this.name = this.constructor.name
        this.statusCode = statusCode
        Error.captureStackTrace(this, this.constructor)
    }
}

export class NotFoundError extends AppError {
    constructor(
        {
            message = "Not Found",
            options,
            statusCode = 404,
        } : IErrorConstructor = {}
    ) {
        super({message, options, statusCode})
    }
}

export class BadRequestError extends AppError {
    constructor(
        {
            message = "Bad Request",
            options,
            statusCode = 400,
        } : IErrorConstructor = {}
    ) {
        super({message, options, statusCode})
    }
}

export class ConflictError extends AppError {
    constructor(
        {
            message = "Conflict Error",
            options,
            statusCode = 409,
        } : IErrorConstructor = {}
    ) {
        super({message, options, statusCode})
    }
}

export class UnauthorizedError extends AppError {
    constructor(
        {
            message = "Invalid credentials",
            options,
            statusCode = 401,
        } : IErrorConstructor = {}
    ) {
        super({message, options, statusCode})
    }
}

export class ForbiddenError extends AppError {
    constructor(
        {
            message = "Don't have permission",
            options,
            statusCode = 403,
        } : IErrorConstructor = {}
    ) {
        super({message, options, statusCode})
    }
}

export const errorHandler = (err: IError, req: Request, res: Response, next: NextFunction): Response => {
    return res.status(Number(err.statusCode) || 500).json({
        message: err.message,
        stack: process.env.MODE === 'DEV' ? err.stack : undefined as unknown as string,
        cause: err.cause
    });
}