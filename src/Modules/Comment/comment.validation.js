"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.controlCommentSchema = exports.updateComment = exports.createReplyschema = exports.createCommentSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const cloud_multer_1 = require("../../Utils/upload/multer/cloud.multer");
exports.createCommentSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(200).optional(),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length, { message: "Duplicate tags are not allowed" }),
        files: zod_1.default.array(zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })).max(3).optional()
    }),
    files: zod_1.default.array(zod_1.default.union([
        validation_middleware_1.generalFields.file([...cloud_multer_1.fileFilter.image, ...cloud_multer_1.fileFilter.video], 1024),
        zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })
    ])).max(3).optional(),
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id
    })
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        data.files = data.body.files;
    }
    delete data.body.files;
    if (!data.body.content && (!data.files?.length)) {
        ctx.addIssue({
            code: "custom",
            path: ["body", "content"],
            message: "content or attachments is required"
        });
    }
});
exports.createReplyschema = zod_1.default.object({
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(200).optional(),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length, { message: "Duplicate tags are not allowed" }),
        files: zod_1.default.array(zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })).max(3).optional()
    }),
    files: zod_1.default.array(zod_1.default.union([
        validation_middleware_1.generalFields.file([...cloud_multer_1.fileFilter.image, ...cloud_multer_1.fileFilter.video], 1024),
        zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })
    ])).max(3).optional(),
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id,
        commentId: validation_middleware_1.generalFields.id
    })
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        data.files = data.body.files;
    }
    delete data.body.files;
    if (!data.body.content && (!data.files?.length)) {
        ctx.addIssue({
            code: "custom",
            path: ["body", "content"],
            message: "content or attachments is required"
        });
    }
});
exports.updateComment = zod_1.default.object({
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(200).optional(),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length, { message: "Duplicate tags are not allowed" }),
        files: zod_1.default.array(zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })).max(3).optional(),
        removeAttachments: zod_1.default.array(zod_1.default.string()).optional(),
        removeTags: zod_1.default.array(validation_middleware_1.generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length, {
            message: "Duplicate tags are not allowed"
        })
    }).optional(),
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id,
        commentId: validation_middleware_1.generalFields.id,
    }),
    files: zod_1.default.array(zod_1.default.union([
        validation_middleware_1.generalFields.file([...cloud_multer_1.fileFilter.image, ...cloud_multer_1.fileFilter.video], 1024),
        zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })
    ])).max(3).optional()
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        data.files = data.body?.files;
    }
    delete data.body?.files;
});
exports.controlCommentSchema = zod_1.default.object({
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id,
        commentId: validation_middleware_1.generalFields.id
    })
});
