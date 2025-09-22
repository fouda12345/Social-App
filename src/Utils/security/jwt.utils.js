"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.verifyToken = exports.createCredentials = exports.getSignatures = exports.getSignatureLevel = exports.SignatureLevel = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../../DB/Models/user.model");
var SignatureLevel;
(function (SignatureLevel) {
    SignatureLevel[SignatureLevel["USER"] = process.env.USER_BEARER_SIGNATURE_LEVEL] = "USER";
    SignatureLevel[SignatureLevel["ADMIN"] = process.env.ADMIN_BEARER_SIGNATURE_LEVEL] = "ADMIN";
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
                accessSecret: process.env.HUGK_JWT_SECRET_ACCESS,
                refreshSecret: process.env.HUGK_JWT_SECRET_REFRESH
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
const verifyToken = (token, secret) => {
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
const generateToken = async ({ payload, secret = process.env.USER_JWT_SECRET_ACCESS, options = { expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME } }) => {
    return await jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
