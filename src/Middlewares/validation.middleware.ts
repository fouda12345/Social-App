import z from "zod";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { BadRequestError } from "../Utils/Handlers/error.handler";
import { GenderEnum } from "../DB/Models/user.model";
import { Types } from "mongoose";
import { fileFilter } from "../Utils/upload/multer/cloud.multer";

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
export const generalFields = {
    fullName: z.string().regex(/^[A-Z][a-z]{2,24}(?:\s[A-Z][a-z]{2,24}){1,2}$/),
    email: z.email(),
    password: z.string(),
    phone: z.string().regex(/^(?:\+20|002|0|20)1[0125][0-9]{8}$/),
    otp: z.string().regex(/^[0-9]{6}$/),
    gender: z.enum(GenderEnum).default(GenderEnum.MALE),
    confirmPassword: (data: any, ctx: z.RefinementCtx) => {
        if (data.newPassword !== data.confirmNewPassword)
            ctx.addIssue({
                code: "custom",
                message: "Passwords do not match"
            })
    },
    id: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid id" }),
    file: function (mimetype : string[] = fileFilter.image , sizeInMB:number = 2) {
        return z.strictObject({
            filename: z.string().optional(),
            fieldname: z.string(),
            originalname: z.string(),
            mimetype: z.string().refine((type) => mimetype.includes(type), { message: `iNvaliud file type`}),
            size: z.number().refine((s) => s <= sizeInMB * 1024 * 1024, { message: `File size should be less than ${sizeInMB}MB` }),
            buffer: z.instanceof(Buffer).optional(),
            path: z.string().optional(),
            encoding: z.string(),
            destination: z.string().optional()
        }).refine((file) => file.buffer || file.path, { message: "File is required" })
    }, 
}

export const validate = (Schema: z.ZodSchema): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): NextFunction => {
        const validationErros: Array<{
            key: string,
            path: string | undefined,
            message: string
        }> = []
        const result = Schema.safeParse(req)
        if (!result.success) {
            const error: Array<{
                path: (string | number | symbol)[],
                message: string,
            }> = JSON.parse(result.error.message)
            error.map(error => validationErros.push(
                {
                    key: error.path.length > 1 ? (error.path[0] as string).toString() : error.path.join('/'),
                    path: error.path.length > 1 ? (error.path).shift() as string && error.path.join('/') : undefined,
                    message: error.message,
                }
            ))
        }
        if (validationErros.length > 0) {
            throw new BadRequestError({ message: "Validation Error", options: { cause: validationErros } })
        }
        return next() as unknown as NextFunction;
    }
}