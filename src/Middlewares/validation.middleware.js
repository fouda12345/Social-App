"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.generalFields = exports.passwordRegex = void 0;
const zod_1 = __importDefault(require("zod"));
const error_handler_1 = require("../Utils/Handlers/error.handler");
const user_model_1 = require("../DB/Models/user.model");
exports.passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
exports.generalFields = {
    fullName: zod_1.default.string().regex(/^[A-Z][a-z]{2,24}(?:\s[A-Z][a-z]{2,24}){1,2}$/),
    email: zod_1.default.email(),
    password: zod_1.default.string(),
    phone: zod_1.default.string().regex(/^(?:\+20|002|0|20)1[0125][0-9]{8}$/),
    otp: zod_1.default.string().regex(/^[0-9]{6}$/),
    gender: zod_1.default.enum(user_model_1.GenderEnum).default(user_model_1.GenderEnum.MALE),
};
const validate = (Schema) => {
    return (req, res, next) => {
        const validationErros = [];
        const result = Schema.safeParse(req);
        if (!result.success) {
            const error = JSON.parse(result.error.message);
            error.map(error => validationErros.push({
                key: error.path.length > 1 ? error.path[0].toString() : error.path.join('/'),
                path: error.path.length > 1 ? (error.path).shift() && error.path.join('/') : undefined,
                message: error.message,
            }));
        }
        if (validationErros.length > 0) {
            throw new error_handler_1.BadRequestError({ message: "Validation Error", options: { cause: validationErros } });
        }
        return next();
    };
};
exports.validate = validate;
