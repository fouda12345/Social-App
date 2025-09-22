"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const error_handler_1 = require("../Utils/Handlers/error.handler");
const jwt_utils_1 = require("../Utils/Security/jwt.utils");
const auth = ({ required = true, tokenType = jwt_utils_1.TokenType.ACCESS }) => {
    return async (req, res, next) => {
        if (!req.headers.authorization && required)
            throw new error_handler_1.BadRequestError({ message: "Authorization header is required" });
        const { user, decodedToken } = await (0, jwt_utils_1.decodeToken)({ authorization: req.headers.authorization, tokenType });
        req.user = user;
        req.decodedToken = decodedToken;
        next();
    };
};
exports.auth = auth;
