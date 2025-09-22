"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.verifyToken = exports.getSecretAndExpireTimefromRole = exports.TokenType = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var TokenType;
(function (TokenType) {
    TokenType["ACCESS"] = "ACCESS";
    TokenType["REFRESH"] = "REFRESH";
})(TokenType || (exports.TokenType = TokenType = {}));
const getSecretAndExpireTimefromRole = (role) => {
    return {
        accessSecret: process.env[`${role}_JWT_SECRET_${TokenType.ACCESS}`],
        accessExpireTime: process.env[`JWT_${TokenType.ACCESS}_EXPIRE_TIME`],
        refreshSecret: process.env[`${role}_JWT_SECRET_${TokenType.REFRESH}`],
        refreshExpireTime: process.env[`JWT_${TokenType.REFRESH}_EXPIRE_TIME`]
    };
};
exports.getSecretAndExpireTimefromRole = getSecretAndExpireTimefromRole;
const verifyToken = (token, secret) => {
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
const generateToken = async ({ payload, secret = process.env.USER_JWT_SECRET_ACCESS, options = { expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME } }) => {
    return await jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
