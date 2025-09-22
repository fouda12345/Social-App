import z from "zod";
import { logoutSchema } from "./user.validation";
export type IlogoutDTO = z.infer<typeof logoutSchema>["body"]