"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.generalFields = exports.passwordRegex = void 0;
const zod_1 = __importDefault(require("zod"));
const error_handler_1 = require("../Utils/Handlers/error.handler");
const user_model_1 = require("../DB/Models/user.model");
const mongoose_1 = require("mongoose");
const cloud_multer_1 = require("../Utils/upload/multer/cloud.multer");
exports.passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
exports.generalFields = {
    fullName: zod_1.default.string().regex(/^[A-Z][a-z]{2,24}(?:\s[A-Z][a-z]{2,24}){1,2}$/),
    email: zod_1.default.email(),
    password: zod_1.default.string(),
    phone: zod_1.default.string().regex(/^(?:\+20|002|0|20)1[0125][0-9]{8}$/),
    otp: zod_1.default.string().regex(/^[0-9]{6}$/),
    gender: zod_1.default.enum(user_model_1.GenderEnum).default(user_model_1.GenderEnum.MALE),
    confirmPassword: (data, ctx) => {
        if (data.newPassword !== data.confirmNewPassword)
            ctx.addIssue({
                code: "custom",
                message: "Passwords do not match"
            });
    },
    id: zod_1.default.string().refine((val) => mongoose_1.Types.ObjectId.isValid(val), { message: "Invalid id" }),
    file: function (mimetype = cloud_multer_1.fileFilter.image, sizeInMB = 2) {
        return zod_1.default.strictObject({
            filename: zod_1.default.string().optional(),
            fieldname: zod_1.default.string(),
            originalname: zod_1.default.string(),
            mimetype: zod_1.default.string().refine((type) => mimetype.includes(type), { message: `iNvaliud file type` }),
            size: zod_1.default.number().refine((s) => s <= sizeInMB * 1024 * 1024, { message: `File size should be less than ${sizeInMB}MB` }),
            buffer: zod_1.default.instanceof(Buffer).optional(),
            path: zod_1.default.string().optional(),
            encoding: zod_1.default.string(),
            destination: zod_1.default.string().optional()
        }).refine((file) => file.buffer || file.path, { message: "File is required" });
    },
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
