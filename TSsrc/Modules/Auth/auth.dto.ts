import z from "zod";
import { confirmEmailSchema, loginSchema, sendConfirmEmailSchema, signupSchema } from "./auth.validation";

export type ISignUpDTO = z.infer<typeof signupSchema>["body"];
export type IConfirmEmailDTO = z.infer<typeof confirmEmailSchema>["body"];
export type ISendConfirmEmailDTO = z.infer<typeof sendConfirmEmailSchema>["body"];
export type ILoginDTO = z.infer<typeof loginSchema>["body"];