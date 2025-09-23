import z, { email } from "zod"
import { generalFields, passwordRegex } from "../../Middlewares/validation.middleware"

export enum logoutFlag {
    ALL = "ALL",
    ONLY = "ONLY"
}

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
export const logoutSchema = z.object({
    body : z.strictObject({
        flag: z.enum(logoutFlag).default(logoutFlag.ONLY)
    })
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