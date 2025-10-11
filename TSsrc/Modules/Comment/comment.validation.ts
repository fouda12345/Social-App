import z from "zod"
import { generalFields, } from "../../Middlewares/validation.middleware"
import { fileFilter } from "../../Utils/upload/multer/cloud.multer"

export const createCommentSchema = z.object({
    body: z.strictObject({
        content : z.string().min(2).max(200).optional(),
        tags : z.array(generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length , {message: "Duplicate tags are not allowed"}),
        files : z.array(z.strictObject({
            contentType : z.string(),
            originalName : z.string()
        })).max(3).optional()
    }),
    files : z.array(z.union([
        generalFields.file([...fileFilter.image,...fileFilter.video] , 1024),
        z.strictObject({
            contentType : z.string(),
            originalName : z.string()
        })
    ])).max(3).optional(),
    params: z.strictObject({
        postId : generalFields.id
    })
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        data.files = data.body.files
    }
    delete data.body.files
    if(!data.body.content && (!data.files?.length)){
        ctx.addIssue({
            code: "custom",
            path: ["body","content"],
            message: "content or attachments is required"
        })
    }
})

export const createReplyschema = createCommentSchema.extend({
    params: z.strictObject({
        commentId : generalFields.id
    })
})

export const updateComment = z.object({
    body: z.strictObject({
        content : z.string().min(2).max(200).optional(),
        tags : z.array(generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length , {message: "Duplicate tags are not allowed"}),
        files : z.array(z.strictObject({
            contentType : z.string(),
            originalName : z.string()
        })).max(3).optional(),
        removeAttachments : z.array(z.string()).optional(),
        removeTags : z.array(generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length , {
            message: "Duplicate tags are not allowed"
        })
    }).optional(),
    params: z.strictObject({
        postId : generalFields.id,
        commentId : generalFields.id,
        
    }),
    files : z.array(z.union([
        generalFields.file([...fileFilter.image,...fileFilter.video] , 1024),
        z.strictObject({
            contentType : z.string(),
            originalName : z.string()
        })
    ])).max(3).optional()    
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        data.files = data.body?.files
    }
    delete data.body?.files
})