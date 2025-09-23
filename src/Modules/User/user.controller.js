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
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const user_validation_1 = require("./user.validation");
const cloud_multer_1 = require("../../Utils/Handlers/multer/cloud.multer");
const router = (0, express_1.Router)();
router.get("/profile{/:id}", (0, auth_middleware_1.auth)({
    accessRoles: user_authorization_1.endpoint.all
}), (0, validation_middleware_1.validate)(user_validation_1.getProfileSchema), user_service_1.default.getProfile);
router.post("/logout", (0, auth_middleware_1.auth)({
    accessRoles: user_authorization_1.endpoint.all
}), (0, validation_middleware_1.validate)(user_validation_1.logoutSchema), user_service_1.default.logout);
router.get("/refresh-token", (0, auth_middleware_1.auth)({
    tokenType: jwt_utils_1.TokenType.REFRESH,
    accessRoles: user_authorization_1.endpoint.all
}), user_service_1.default.refreshToken);
router.patch("/update-profile", (0, auth_middleware_1.auth)({
    accessRoles: user_authorization_1.endpoint.all
}), (0, validation_middleware_1.validate)(user_validation_1.updateProfileSchema), user_service_1.default.updateProfile);
router.patch("/change-password", (0, auth_middleware_1.auth)({
    accessRoles: user_authorization_1.endpoint.all
}), (0, validation_middleware_1.validate)(user_validation_1.changePasswordSchema), user_service_1.default.changePassword);
router.post("/foregt-password", (0, validation_middleware_1.validate)(user_validation_1.forgetPasswordSchema), user_service_1.default.forgetPassword);
router.patch("/reset-password", (0, validation_middleware_1.validate)(user_validation_1.resetPasswordSchema), user_service_1.default.resetPassword);
router.patch("/profile-image", (0, auth_middleware_1.auth)({
    accessRoles: user_authorization_1.endpoint.all
}), (0, cloud_multer_1.cloudFileUpload)().single("profileImage"), user_service_1.default.uploadProfileImage);
exports.default = router;
