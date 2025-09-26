"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.decodeToken = exports.createCredentials = exports.getSignatures = exports.getSignatureLevel = exports.SignatureLevel = exports.TokenType = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../../DB/Models/user.model");
const error_handler_1 = require("../Handlers/error.handler");
const user_reposetory_1 = require("../../DB/reposetories/user.reposetory");
const uuid_1 = require("uuid");
const token_reposetory_1 = require("../../DB/reposetories/token.reposetory");
var TokenType;
(function (TokenType) {
    TokenType["ACCESS"] = "ACCESS";
    TokenType["REFRESH"] = "REFRESH";
})(TokenType || (exports.TokenType = TokenType = {}));
var SignatureLevel;
(function (SignatureLevel) {
    SignatureLevel["USER"] = "ATCH";
    SignatureLevel["ADMIN"] = "HUGK";
})(SignatureLevel || (exports.SignatureLevel = SignatureLevel = {}));
const getSignatureLevel = async (role) => {
    let signatureLevel;
    switch (role) {
        case user_model_1.RoleEnum.ADMIN:
            signatureLevel = SignatureLevel.ADMIN;
            break;
        case user_model_1.RoleEnum.USER:
            signatureLevel = SignatureLevel.USER;
    }
    return signatureLevel;
};
exports.getSignatureLevel = getSignatureLevel;
const getSignatures = async (signatureLevel) => {
    let signatures = { accessSecret: "", refreshSecret: "" };
    switch (signatureLevel) {
        case SignatureLevel.ADMIN:
            signatures = {
                accessSecret: process.env.ADMIN_JWT_SECRET_ACCESS,
                refreshSecret: process.env.ADMIN_JWT_SECRET_REFRESH
            };
            break;
        case SignatureLevel.USER:
            signatures = {
                accessSecret: process.env.USER_JWT_SECRET_ACCESS,
                refreshSecret: process.env.USER_JWT_SECRET_REFRESH
            };
            break;
        default:
            throw new error_handler_1.UnauthorizedError({ message: "Invalid signature" });
    }
    return signatures;
};
exports.getSignatures = getSignatures;
const createCredentials = async (user) => {
    const signatures = await (0, exports.getSignatures)(await (0, exports.getSignatureLevel)(user.role));
    const jwtid = (0, uuid_1.v4)();
    const accessToken = await (0, exports.generateToken)({
        payload: { _id: user._id, },
        secret: signatures.accessSecret,
        options: {
            expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME,
            jwtid
        }
    });
    const refreshToken = await (0, exports.generateToken)({
        payload: { _id: user._id, },
        secret: signatures.refreshSecret,
        options: {
            expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME,
            jwtid
        }
    });
    return { accessToken, refreshToken };
};
exports.createCredentials = createCredentials;
const decodeToken = async ({ authorization, tokenType = TokenType.ACCESS }) => {
    const [bearer, token] = authorization?.split(" ");
    if (!bearer || !token)
        throw new error_handler_1.UnauthorizedError({ message: "missing token parts" });
    const signatures = await (0, exports.getSignatures)(bearer);
    const decodedToken = await (0, exports.verifyToken)({
        token,
        secret: tokenType === TokenType.ACCESS ? signatures.accessSecret : signatures.refreshSecret
    });
    if (!decodedToken?._id || !decodedToken?.iat || !decodedToken?.jti)
        throw new error_handler_1.UnauthorizedError({ message: "Invalid Token Payload" });
    const tokenModel = new token_reposetory_1.TokenReposetory();
    if (await tokenModel.findOne({ filter: { jti: decodedToken.jti } }))
        throw new error_handler_1.UnauthorizedError({ message: "Invalid or Expired Token" });
    const userModel = new user_reposetory_1.UserReposetory();
    const user = await userModel.findOne({ filter: { _id: decodedToken._id }, lean: true });
    if (!user)
        throw new error_handler_1.NotFoundError({ message: "Account not registered" });
    if (Number(user.credentailsUpdatedAt?.getTime()) > decodedToken.iat * 1000)
        throw new error_handler_1.UnauthorizedError({ message: "Invalid or Expired Token" });
    return { user, decodedToken };
};
exports.decodeToken = decodeToken;
const generateToken = async ({ payload, secret = process.env.USER_JWT_SECRET_ACCESS, options = { expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME } }) => {
    return await jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secret }) => {
    return await jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
