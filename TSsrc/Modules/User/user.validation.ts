import z from "zod"
import { generalFields, passwordRegex } from "../../Middlewares/validation.middleware"



export enum changePasswordFlag {
    ALL = "ALL",   /// logout all devices
    KEEP_ME = "KEEP_ME",  /// logout all devices but current
    KEEP_ALL = "KEEP_ALL"
}

export const getProfileSchema = z.object({
    params : z.strictObject({
        id : z.string().optional()
    }).superRefine(generalFields.checkId)
})

export const updateProfileSchema = z.object({
    body : z.strictObject({
        fullName : generalFields.fullName.optional(),
        gender: generalFields.gender.optional(),
        phone: generalFields.phone.optional()
    })
})

export const changePasswordSchema = z.object({
    body : z.strictObject({
        oldPassword : generalFields.password,
        newPassword : generalFields.password.regex(passwordRegex),
        confirmNewPassword : z.string(),
        flag: z.enum(changePasswordFlag).default(changePasswordFlag.KEEP_ME)
    }).superRefine(generalFields.confirmPassword)
})

export const forgetPasswordSchema = z.object({
    body : z.strictObject({
        email : generalFields.email
    })
})

export const resetPasswordSchema = z.object({
    body : z.strictObject({
        email : generalFields.email,
        newPassword : generalFields.password.regex(passwordRegex),
        confirmNewPassword : z.string(),
        otp : generalFields.otp
    }).superRefine(generalFields.confirmPassword)
})

export const profileImageSchema = z.object({
    body: z.strictObject({
        contentType : z.string().optional(),
        originalName : z.string().optional()
    })
})

export const coverImagesSchema = z.object({
    body: z.strictObject({
        files : z.array(
            z.strictObject({
                contentType : z.string(),
                originalName : z.string()
            })
        ).optional()
    })
})

export const deleteAssetSchema = z.object({
    body: z.strictObject({
        key : z.string().optional(),
        keys : z.array(z.string()).optional()
    }).superRefine((data, ctx) => {
        if(!data.key && !data.keys?.length)
            ctx.addIssue({
                code: "custom",
                message: "key or keys is required"
            })
    })
})