import z from "zod"
import { generalFields } from "../../Middlewares/validation.middleware"


export const getChatSchema = z.object({
    params: z.strictObject({
        userId: generalFields.id
    })
})

export const createGroupSchema = z.object({
    body: z.strictObject({
        group: z.string().min(2).max(20),
        participants: z.array(generalFields.id).min(1)
    }).superRefine((data, ctx) => {
        if (data.participants.length != new Set(data.participants).size) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Duplicate participants are not allowed"
            })
        }
    })
})

export const getGroupSchema = z.object({
    params: z.strictObject({
        groupId: generalFields.id
    })
})