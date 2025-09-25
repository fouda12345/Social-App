import z from "zod";
import { changePasswordSchema, coverImagesSchema, deleteAssetSchema, forgetPasswordSchema, getProfileSchema, logoutSchema, profileImageSchema, resetPasswordSchema, updateProfileSchema } from "./user.validation";
export type IlogoutDTO = z.infer<typeof logoutSchema>["body"]
export type IgetProfileDTO = z.infer<typeof getProfileSchema>["params"]
export type IupdateProfileDTO = z.infer<typeof updateProfileSchema>["body"]
export type IchangePasswordDTO = z.infer<typeof changePasswordSchema>["body"]
export type IresetPasswordDTO = z.infer<typeof resetPasswordSchema>["body"]
export type IforgetPasswordDTO = z.infer<typeof forgetPasswordSchema>["body"]
export type IprofileImageDTO = z.infer<typeof profileImageSchema>["body"]
export type IcoverImagesDTO = z.infer<typeof coverImagesSchema>["body"]
export type IdeleteAssetDTO = z.infer<typeof deleteAssetSchema>["body"]