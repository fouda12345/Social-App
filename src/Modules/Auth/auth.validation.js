"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.sendConfirmEmailSchema = exports.confirmEmailSchema = exports.signupSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
exports.signupSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        fullName: validation_middleware_1.generalFields.fullName,
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password.regex(validation_middleware_1.passwordRegex),
        confirmPassword: zod_1.default.string(),
        phone: validation_middleware_1.generalFields.phone.optional(),
        gender: validation_middleware_1.generalFields.gender.optional()
    }).superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword)
            ctx.addIssue({
                code: "custom",
                message: "Passwords do not match"
            });
    })
});
exports.confirmEmailSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        otp: validation_middleware_1.generalFields.otp,
        email: validation_middleware_1.generalFields.email
    })
});
exports.sendConfirmEmailSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        email: validation_middleware_1.generalFields.email
    })
});
exports.loginSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password
    })
});
