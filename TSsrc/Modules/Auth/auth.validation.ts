import z from 'zod';
import { generalFields, passwordRegex } from '../../Middlewares/validation.middleware';


export const signupSchema = z.object({
    body : z.strictObject({
        fullName : generalFields.fullName,
        email : generalFields.email,
        password : generalFields.password.regex(passwordRegex),
        confirmPassword : z.string(),
        phone : generalFields.phone.optional(),
        gender: generalFields.gender.optional()
    }).superRefine(generalFields.confirmPassword)
})

export const confirmEmailSchema = z.object({
    body : z.strictObject({
        otp : generalFields.otp,
        email : generalFields.email
    })
})

export const sendConfirmEmailSchema = z.object({
    body : z.strictObject({
        email : generalFields.email
    })
})

export const loginSchema = z.object({
    body : z.strictObject({
        email : generalFields.email,
        password : generalFields.password
    })
})