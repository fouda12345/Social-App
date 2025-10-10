import z from "zod"
import { generalFields } from "../../Middlewares/validation.middleware"
import { PrivacyEnum } from "../../DB/Models/post.model"
import { fileFilter } from "../../Utils/upload/multer/cloud.multer"

export const createPostSchema = z.object({
    body: z.strictObject({
        shared : z.boolean().optional().default(false),
        originalPostId : generalFields.id.optional(),
        authorId : generalFields.id.optional(),
        content : z.string().min(2).max(5000).optional(),
        tags : z.array(generalFields.id).optional(),
        privacy : z.enum(PrivacyEnum).default(PrivacyEnum.PUBLIC),
        allowComments : z.boolean().default(true),
        files : z.array(z.strictObject({
            contentType : z.string().optional(),
            originalName : z.string().optional()
        })).max(5).optional()
    }).superRefine((data, ctx) => {
        if(data.shared && (!data.originalPostId || !data.authorId)){ 
            ctx.addIssue({
                code: "custom",
                message: "originalPostId && authorId is required"
            })
        }
        if(data.tags && data.tags.length > 0 && data.tags.length !== [...new Set(data.tags)].length)
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicate tags are not allowed"
            })
    }),
    files : z.array(z.union([
        generalFields.file([...fileFilter.image,...fileFilter.video] , 1024),
        z.strictObject({
            contentType : z.string().optional(),
            originalName : z.string().optional()
        })
    ])).max(5).optional()
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        data.files = data.body.files
    }
    delete data.body.files
    if(!data.body.content && (!data.files || data.files.length === 0)){
        ctx.addIssue({
            code: "custom",
            path: ["body","content"],
            message: "content or attachments is required"
        })
    }
})

export const updatePostSchema = z.object({
    body: z.strictObject({
        content : z.string().min(2).max(5000).optional(),
        privacy : z.enum(PrivacyEnum).optional(),
        allowComments : z.boolean().optional(),
    }),
    params: z.strictObject({
        postId : generalFields.id
    })
})