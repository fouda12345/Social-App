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
var TokenType;
(function (TokenType) {
    TokenType["ACCESS"] = "ACCESS";
    TokenType["REFRESH"] = "REFRESH";
})(TokenType || (exports.TokenType = TokenType = {}));
var SignatureLevel;
(function (SignatureLevel) {
    SignatureLevel["USER"] = "rttwr";
    SignatureLevel["ADMIN"] = "dyhsrft";
})(SignatureLevel || (exports.SignatureLevel = SignatureLevel = {}));
const getSignatureLevel = async (role = user_model_1.RoleEnum.USER) => {
    let signatureLevel = SignatureLevel.USER;
    switch (role) {
        case user_model_1.RoleEnum.ADMIN:
            signatureLevel = SignatureLevel.ADMIN;
            break;
        default:
            signatureLevel = SignatureLevel.USER;
    }
    return signatureLevel;
};
exports.getSignatureLevel = getSignatureLevel;
const getSignatures = async (signatureLevel = SignatureLevel.USER) => {
    let signatures = { accessSecret: "", refreshSecret: "" };
    switch (signatureLevel) {
        case SignatureLevel.ADMIN:
            signatures = {
                accessSecret: process.env.ADMIN_JWT_SECRET_ACCESS,
                refreshSecret: process.env.ADMIN_JWT_SECRET_REFRESH
            };
            break;
        default:
            signatures = {
                accessSecret: process.env.USER_JWT_SECRET_ACCESS,
                refreshSecret: process.env.USER_JWT_SECRET_REFRESH
            };
    }
    return signatures;
};
exports.getSignatures = getSignatures;
const createCredentials = async (user) => {
    const signatures = await (0, exports.getSignatures)(await (0, exports.getSignatureLevel)(user.role));
    const accessToken = await (0, exports.generateToken)({
        payload: { id: user._id, },
        secret: signatures.accessSecret,
        options: {
            expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME
        }
    });
    const refreshToken = await (0, exports.generateToken)({
        payload: { id: user._id, },
        secret: signatures.refreshSecret,
        options: {
            expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME
        }
    });
    return { accessToken, refreshToken };
};
exports.createCredentials = createCredentials;
const decodeToken = async ({ authorization, tokenType = TokenType.ACCESS }) => {
    const [bearer, token] = authorization?.split(" ");
    if (!bearer || !token)
        throw new error_handler_1.UnAuthorizedError({ message: "missing token parts" });
    const signatures = await (0, exports.getSignatures)(bearer);
    const decodedToken = await (0, exports.verifyToken)({
        token,
        secret: tokenType === TokenType.ACCESS ? signatures.accessSecret : signatures.refreshSecret
    });
    if (!decodedToken?.id || !decodedToken?.iat)
        throw new error_handler_1.UnAuthorizedError({ message: "Invalid Token Payload" });
    const userModel = new user_reposetory_1.UserReposetory();
    const user = await userModel.findOne({ filter: { _id: decodedToken.id } });
    if (!user)
        throw new error_handler_1.NotFoundError({ message: "Account not registered" });
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
