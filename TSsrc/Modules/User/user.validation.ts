import z from "zod"

export enum logoutFlag {
    ALL = "ALL",
    ONLY = "ONLY"
}

export const logoutSchema = z.object({
    body : z.strictObject({
        flag: z.enum(logoutFlag).default(logoutFlag.ONLY)
    })
})