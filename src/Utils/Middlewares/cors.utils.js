"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const error_handler_1 = require("../Handlers/error.handler");
const whitelist = process.env.WHITELIST?.split(',');
exports.corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist?.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new error_handler_1.AppError({ message: 'Not allowed by CORS', options: { cause: `Origin ${origin} is not whitelisted` }, statusCode: 403 }));
        }
    }
};
