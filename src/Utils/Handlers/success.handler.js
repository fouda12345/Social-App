"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successHandler = void 0;
const successHandler = ({ res, statusCode = 200, message = "Success", data = undefined, }) => {
    return res.status(statusCode).json({ message: message, data });
};
exports.successHandler = successHandler;
