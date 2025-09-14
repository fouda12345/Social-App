"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = Number(err.cause) || 500;
    const message = err.message || "Internal Server Error";
    const stack = process.env.MODE === 'production' ? undefined : err.stack;
    return res.status(statusCode).json({ message, stack, statusCode });
};
exports.errorHandler = errorHandler;
