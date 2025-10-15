"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.controlPostSchema = exports.getPostsSchema = exports.PostSortingEnum = exports.getSinglePostSchema = exports.likePostSchema = exports.updatePostSchema = exports.sharePostSchema = exports.createPostSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const post_model_1 = require("../../DB/Models/post.model");
const cloud_multer_1 = require("../../Utils/upload/multer/cloud.multer");
exports.createPostSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        shared: zod_1.default.boolean().optional().default(false),
        originalPostId: validation_middleware_1.generalFields.id.optional(),
        authorId: validation_middleware_1.generalFields.id.optional(),
        content: zod_1.default.string().min(2).max(5000).optional(),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length, { message: "Duplicate tags are not allowed" }),
        privacy: zod_1.default.enum(post_model_1.PrivacyEnum).default(post_model_1.PrivacyEnum.PUBLIC),
        allowComments: zod_1.default.boolean().default(true),
        files: zod_1.default.array(zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })).max(5).optional()
    }).superRefine((data, ctx) => {
        if (data.shared && (!data.originalPostId || !data.authorId)) {
            ctx.addIssue({
                code: "custom",
                message: "originalPostId && authorId is required"
            });
        }
    }),
    files: zod_1.default.array(zod_1.default.union([
        validation_middleware_1.generalFields.file([...cloud_multer_1.fileFilter.image, ...cloud_multer_1.fileFilter.video], 1024),
        zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })
    ])).max(5).optional()
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
exports.sharePostSchema = zod_1.default.object({
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id
    })
});
exports.updatePostSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(5000).optional(),
        privacy: zod_1.default.enum(post_model_1.PrivacyEnum).optional(),
        allowComments: zod_1.default.boolean().optional(),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length, { message: "Duplicate tags are not allowed" }),
        files: zod_1.default.array(zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })).max(5).optional(),
        removeAttachments: zod_1.default.array(zod_1.default.string()).optional(),
        removeTags: zod_1.default.array(validation_middleware_1.generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length, {
            message: "Duplicate tags are not allowed"
        })
    }).optional(),
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id
    }),
    files: zod_1.default.array(zod_1.default.union([
        validation_middleware_1.generalFields.file([...cloud_multer_1.fileFilter.image, ...cloud_multer_1.fileFilter.video], 1024),
        zod_1.default.strictObject({
            contentType: zod_1.default.string(),
            originalName: zod_1.default.string()
        })
    ])).max(5).optional()
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        data.files = data.body?.files || [];
    }
    delete data.body?.files;
});
exports.likePostSchema = zod_1.default.object({
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id
    })
});
exports.getSinglePostSchema = exports.likePostSchema;
var PostSortingEnum;
(function (PostSortingEnum) {
    PostSortingEnum["NEWEST"] = "NEWEST";
    PostSortingEnum["OLDEST"] = "OLDEST";
    PostSortingEnum["LATEST_ACTIVITY"] = "LATEST_ACTIVITY";
    PostSortingEnum["POPULAR"] = "POPULAR";
})(PostSortingEnum || (exports.PostSortingEnum = PostSortingEnum = {}));
exports.getPostsSchema = zod_1.default.object({
    query: zod_1.default.strictObject({
        page: zod_1.default.string().transform((val, ctx) => {
            const page = parseInt(val);
            if (isNaN(page) || page < 1) {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid page number"
                });
                return zod_1.default.NEVER;
            }
            return page;
        }).optional().default(1),
        limit: zod_1.default.string().transform((val, ctx) => {
            const limit = parseInt(val);
            if (isNaN(limit) || limit < 1) {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid page number"
                });
                return zod_1.default.NEVER;
            }
            return limit;
        }).optional().default(10),
        sortBy: zod_1.default.enum(PostSortingEnum).optional().default(PostSortingEnum.LATEST_ACTIVITY),
    })
});
exports.controlPostSchema = zod_1.default.object({
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id
    })
});
