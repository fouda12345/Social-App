"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.controlAccountSchema = exports.deleteAssetSchema = exports.coverImagesSchema = exports.profileImageSchema = exports.resetPasswordSchema = exports.forgetPasswordSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.getProfileSchema = exports.changePasswordFlag = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const cloud_multer_1 = require("../../Utils/upload/multer/cloud.multer");
var changePasswordFlag;
(function (changePasswordFlag) {
    changePasswordFlag["ALL"] = "ALL";
    changePasswordFlag["KEEP_ME"] = "KEEP_ME";
    changePasswordFlag["KEEP_ALL"] = "KEEP_ALL";
})(changePasswordFlag || (exports.changePasswordFlag = changePasswordFlag = {}));
exports.getProfileSchema = zod_1.default.object({
    params: zod_1.default.strictObject({
        id: validation_middleware_1.generalFields.id.optional()
    })
});
exports.updateProfileSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        fullName: validation_middleware_1.generalFields.fullName.optional(),
        gender: validation_middleware_1.generalFields.gender.optional(),
        phone: validation_middleware_1.generalFields.phone.optional()
    })
});
exports.changePasswordSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        oldPassword: validation_middleware_1.generalFields.password,
        newPassword: validation_middleware_1.generalFields.password.regex(validation_middleware_1.passwordRegex),
        confirmNewPassword: zod_1.default.string(),
        flag: zod_1.default.enum(changePasswordFlag).default(changePasswordFlag.KEEP_ME)
    }).superRefine(validation_middleware_1.generalFields.confirmPassword)
});
exports.forgetPasswordSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        email: validation_middleware_1.generalFields.email
    })
});
exports.resetPasswordSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        email: validation_middleware_1.generalFields.email,
        newPassword: validation_middleware_1.generalFields.password.regex(validation_middleware_1.passwordRegex),
        confirmNewPassword: zod_1.default.string(),
        otp: validation_middleware_1.generalFields.otp
    }).superRefine(validation_middleware_1.generalFields.confirmPassword)
});
exports.profileImageSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        file: zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        }).optional()
    }),
    file: zod_1.default.union([validation_middleware_1.generalFields.file(cloud_multer_1.fileFilter.image, 5), zod_1.default.strictObject({
            contentType: zod_1.default.string().optional(),
            originalName: zod_1.default.string().optional()
        })]).optional()
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        if (!data.body.file)
            ctx.addIssue({
                code: "custom",
                path: ["body", "files"],
                message: "file is required"
            });
        data.file = data.body.file;
    }
    delete data.body.file;
    if (!data.file) {
        ctx.addIssue({
            code: "custom",
            path: ["files"],
            message: "file is required"
        });
    }
});
exports.coverImagesSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        files: zod_1.default.array(zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })).optional()
    }),
    files: zod_1.default.array(zod_1.default.union([
        validation_middleware_1.generalFields.file(cloud_multer_1.fileFilter.image, 5),
        zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })
    ])).max(5).optional()
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        if (!data.body.files?.length)
            ctx.addIssue({
                code: "custom",
                path: ["body", "files"],
                message: "files is required"
            });
        data.files = data.body.files;
    }
    delete data.body.files;
    if (!data.files?.length) {
        ctx.addIssue({
            code: "custom",
            path: ["files"],
            message: "files is required"
        });
    }
});
exports.deleteAssetSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        key: zod_1.default.string().optional(),
        keys: zod_1.default.array(zod_1.default.string()).optional()
    }).superRefine((data, ctx) => {
        if (!data.key && !data.keys?.length)
            ctx.addIssue({
                code: "custom",
                message: "key or keys is required"
            });
    })
});
exports.controlAccountSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        password: validation_middleware_1.generalFields.password,
    }),
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id.optional()
    })
});
