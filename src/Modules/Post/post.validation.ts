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
        tags : z.array(generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length , {message: "Duplicate tags are not allowed"}),
        privacy : z.enum(PrivacyEnum).default(PrivacyEnum.PUBLIC),
        allowComments : z.boolean().default(true),
        files : z.array(z.strictObject({
            contentType : z.string(),
            originalName : z.string()
        })).max(5).optional()
    }).superRefine((data, ctx) => {
        if(data.shared && (!data.originalPostId || !data.authorId)){ 
            ctx.addIssue({
                code: "custom",
                message: "originalPostId && authorId is required"
            })
        }
    }),
    files : z.array(z.union([
        generalFields.file([...fileFilter.image,...fileFilter.video] , 1024),
        z.strictObject({
            contentType : z.string(),
            originalName : z.string()
        })
    ])).max(5).optional()
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

export const sharePostSchema = z.object({
    params: z.strictObject({
        postId : generalFields.id
    })
})

export const updatePostSchema = z.object({
    body: z.strictObject({
        content : z.string().min(2).max(5000).optional(),
        privacy : z.enum(PrivacyEnum).optional(),
        allowComments : z.boolean().optional(),
        tags : z.array(generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length , {message: "Duplicate tags are not allowed"}),
        files : z.array(z.strictObject({
            contentType : z.string(),
            originalName : z.string()
        })).max(5).optional(),
        removeAttachments : z.array(z.string()).optional(),
        removeTags : z.array(generalFields.id).optional().refine((tags) => [...new Set(tags)].length === tags?.length , {
            message: "Duplicate tags are not allowed"
        })
    }).optional(),
    params: z.strictObject({
        postId : generalFields.id
    }),
    files : z.array(z.union([
        generalFields.file([...fileFilter.image,...fileFilter.video] , 1024),
        z.strictObject({
            contentType : z.string(),
            originalName : z.string()
        })
    ])).max(5).optional()
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        data.files = data.body?.files || []
    }
    delete data.body?.files
})

export const likePostSchema = z.object({
    params: z.strictObject({
        postId : generalFields.id
    })
})

export const getSinglePostSchema = likePostSchema

export enum PostSortingEnum {
    NEWEST = "NEWEST",
    OLDEST = "OLDEST",
    LATEST_ACTIVITY = "LATEST_ACTIVITY",
    POPULAR = "POPULAR"
}   

export const getPostsSchema = z.object({
    query: z.strictObject({
        page: z.string().transform((val,ctx) =>{
            const page = parseInt(val)
            if(isNaN(page) || page < 1){
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid page number"
                })
                return z.NEVER
            }
            return page
        }).optional().default(1),
        limit: z.string().transform((val,ctx) =>{
            const limit = parseInt(val)
            if(isNaN(limit) || limit < 1){
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid page number"
                })
                return z.NEVER
            }
            return limit
        }).optional().default(10),
        sortBy: z.enum(PostSortingEnum).optional().default(PostSortingEnum.LATEST_ACTIVITY),
    })
})

export const controlPostSchema = z.object({
    params: z.strictObject({
        postId : generalFields.id
    })
})  