"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const auth_validation_1 = require("./auth.validation");
const user_validation_1 = require("../User/user.validation");
const auth_middleware_1 = require("../../Middlewares/auth.middleware");
const jwt_utils_1 = require("../../Utils/Security/jwt.utils");
const user_authorization_1 = require("../User/user.authorization");
const router = (0, express_1.Router)();
router.post("/register", (0, validation_middleware_1.validate)(auth_validation_1.signupSchema), auth_service_1.default.signup);
router.post("/confirm-email", (0, validation_middleware_1.validate)(auth_validation_1.confirmEmailSchema), auth_service_1.default.confirmEmail);
router.post("/send-confirm-email", (0, validation_middleware_1.validate)(auth_validation_1.sendConfirmEmailSchema), auth_service_1.default.sendConfirmEmail);
router.post("/login", (0, validation_middleware_1.validate)(auth_validation_1.loginSchema), auth_service_1.default.login);
router.post("/logout", (0, auth_middleware_1.auth)({
    accessRoles: user_authorization_1.endpoint.all
}), (0, validation_middleware_1.validate)(user_validation_1.logoutSchema), auth_service_1.default.logout);
router.get("/refresh-token", (0, auth_middleware_1.auth)({
    tokenType: jwt_utils_1.TokenType.REFRESH,
    accessRoles: user_authorization_1.endpoint.all
}), auth_service_1.default.refreshToken);
exports.default = router;
