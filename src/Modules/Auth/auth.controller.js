"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
router.post("/register", (0, validation_middleware_1.validate)(auth_validation_1.signupSchema), auth_service_1.default.signup);
router.post("/confirm-email", (0, validation_middleware_1.validate)(auth_validation_1.confirmEmailSchema), auth_service_1.default.confirmEmail);
router.post("/send-confirm-email", (0, validation_middleware_1.validate)(auth_validation_1.sendConfirmEmailSchema), auth_service_1.default.sendConfirmEmail);
router.post("/login", (0, validation_middleware_1.validate)(auth_validation_1.loginSchema), auth_service_1.default.login);
exports.default = router;
