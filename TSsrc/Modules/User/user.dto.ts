import z from "zod";
import { changePasswordSchema, deleteAssetSchema, forgetPasswordSchema, getProfileSchema, resetPasswordSchema, updateProfileSchema } from "./user.validation";

export type IgetProfileDTO = z.infer<typeof getProfileSchema>["params"]
export type IupdateProfileDTO = z.infer<typeof updateProfileSchema>["body"]
export type IchangePasswordDTO = z.infer<typeof changePasswordSchema>["body"]
export type IresetPasswordDTO = z.infer<typeof resetPasswordSchema>["body"]
export type IforgetPasswordDTO = z.infer<typeof forgetPasswordSchema>["body"]
export type IdeleteAssetDTO = z.infer<typeof deleteAssetSchema>["body"]