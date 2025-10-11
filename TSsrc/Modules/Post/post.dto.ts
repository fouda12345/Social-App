import z from "zod"
import { createPostSchema, getPostsSchema } from "./post.validation"

export type ICreatePostDTO = z.infer<typeof createPostSchema>["body"]
export type IGetPostsDTO = z.infer<typeof getPostsSchema>["query"]