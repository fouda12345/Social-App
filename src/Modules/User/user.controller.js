"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const auth_middleware_1 = require("../../Middlewares/auth.middleware");
const user_authorization_1 = require("./user.authorization");
const jwt_utils_1 = require("../../Utils/Security/jwt.utils");
const router = (0, express_1.Router)();
router.get("/profile", (0, auth_middleware_1.auth)({
    accessRoles: user_authorization_1.endpoint.all
}), user_service_1.default.getProfile);
router.post("/logout", (0, auth_middleware_1.auth)({
    accessRoles: user_authorization_1.endpoint.all
}), user_service_1.default.logout);
router.get("/refresh-token", (0, auth_middleware_1.auth)({
    tokenType: jwt_utils_1.TokenType.REFRESH,
    accessRoles: user_authorization_1.endpoint.all
}), user_service_1.default.refreshToken);
exports.default = router;
