import z from "zod"
import { generalFields, passwordRegex } from "../../Middlewares/validation.middleware"
import { fileFilter } from "../../Utils/upload/multer/cloud.multer"



export enum changePasswordFlag {
    ALL = "ALL",   /// logout all devices
    KEEP_ME = "KEEP_ME",  /// logout all devices but current
    KEEP_ALL = "KEEP_ALL"
}

export enum FriednRequestResponse {
    ACCEPT = "ACCEPT",
    REJECT = "REJECT"
}

export const getProfileSchema = z.object({
    params: z.strictObject({
        id: generalFields.id.optional()
    }),
    query: z.strictObject({
        groups: z.string().transform((groups,ctx) => {
            if (groups === "true"){
                return true
            }else if (groups === "false"){
                return false
            } else {
                ctx.addIssue({
                    code: "custom",
                    path: ["groups"],
                    message: "groups must be true or false"
                })
                return z.NEVER
            }
        }).optional()
    })
})

export const updateProfileSchema = z.object({
    body: z.strictObject({
        fullName: generalFields.fullName.optional(),
        gender: generalFields.gender.optional(),
        phone: generalFields.phone.optional()
    })
})

export const changePasswordSchema = z.object({
    body: z.strictObject({
        oldPassword: generalFields.password,
        newPassword: generalFields.password.regex(passwordRegex),
        confirmNewPassword: z.string(),
        flag: z.enum(changePasswordFlag).default(changePasswordFlag.KEEP_ME)
    }).superRefine(generalFields.confirmPassword)
})

export const forgetPasswordSchema = z.object({
    body: z.strictObject({
        email: generalFields.email
    })
})

export const resetPasswordSchema = z.object({
    body: z.strictObject({
        email: generalFields.email,
        newPassword: generalFields.password.regex(passwordRegex),
        confirmNewPassword: z.string(),
        otp: generalFields.otp
    }).superRefine(generalFields.confirmPassword)
})

export const profileImageSchema = z.object({
    body: z.strictObject({
        file: z.strictObject({
            contentType: z.string(),
            originalName: z.string()
        }).optional(),
    }),
    file: z.union([generalFields.file(fileFilter.image, 5), z.strictObject({
        contentType: z.string(),
        originalName: z.string()
    })]).optional()
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        if (!data.body.file)
            ctx.addIssue({
                code: "custom",
                path: ["body", "files"],
                message: "file is required"
            })
        data.file = data.body.file
    }
    delete data.body.file
    if (!data.file) {
        ctx.addIssue({
            code: "custom",
            path: ["files"],
            message: "file is required"
        })
    }
})

export const coverImagesSchema = z.object({
    body: z.strictObject({
        files: z.array(
            z.strictObject({
                contentType: z.string(),
                originalName: z.string()
            })
        ).optional()
    }),
    files: z.array(z.union([
        generalFields.file(fileFilter.image, 5),
        z.strictObject({
            contentType: z.string(),
            originalName: z.string()
        })
    ])).max(5).optional()
}).superRefine((data, ctx) => {
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED") {
        if (!data.body.files?.length)
            ctx.addIssue({
                code: "custom",
                path: ["body", "files"],
                message: "files is required"
            })
        data.files = data.body.files
    }
    delete data.body.files
    if (!data.files?.length) {
        ctx.addIssue({
            code: "custom",
            path: ["files"],
            message: "files is required"
        })
    }
})

export const deleteAssetSchema = z.object({
    body: z.strictObject({
        key: z.string().optional(),
        keys: z.array(z.string()).optional()
    }).superRefine((data, ctx) => {
        if (!data.key && !data.keys?.length)
            ctx.addIssue({
                code: "custom",
                message: "key or keys is required"
            })
    })
})

export const controlAccountSchema = z.object({
    body: z.strictObject({
        password: generalFields.password,
    }),
    params: z.strictObject({
        userId: generalFields.id.optional()
    })
})

export const manageFriendSchema = z.object({
    params: z.strictObject({
        userId: generalFields.id
    })
})

export const respondToFriendRequestSchema = z.object({
    params: z.strictObject({
        friendRequestId: generalFields.id
    }),
    query: z.strictObject({
        response: z.enum(FriednRequestResponse)
    })
})