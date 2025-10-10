import z from "zod"
import { createPostSchema } from "./post.validation"

export type IcreatePostDTO = z.infer<typeof createPostSchema>["body"]