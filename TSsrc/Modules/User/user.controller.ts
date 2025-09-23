import { Router } from "express";
import userServices from "./user.service";
import { auth } from "../../Middlewares/auth.middleware";
import { endpoint } from "./user.authorization";
import { TokenType } from "../../Utils/Security/jwt.utils";
import { validate } from "../../Middlewares/validation.middleware";
import { changePasswordSchema, forgetPasswordSchema, getProfileSchema, logoutSchema, resetPasswordSchema, updateProfileSchema } from "./user.validation";
import { cloudFileUpload } from "../../Utils/Handlers/multer/cloud.multer";
const router   = Router();

router.get(
    "/profile{/:id}",
    auth({
        accessRoles:endpoint.all
    }),
    validate(getProfileSchema),
    userServices.getProfile
);

router.post(
    "/logout",
    auth({
        accessRoles:endpoint.all
    }),
    validate(logoutSchema),
    userServices.logout
);

router.get(
    "/refresh-token",
    auth({
        tokenType:TokenType.REFRESH,
        accessRoles:endpoint.all
    }),
    userServices.refreshToken
);

router.patch(
    "/update-profile",
    auth({
        accessRoles:endpoint.all
    }),
    validate(updateProfileSchema),
    userServices.updateProfile
);

router.patch(
    "/change-password",
    auth({
        accessRoles:endpoint.all
    }),
    validate(changePasswordSchema),
    userServices.changePassword
);

router.post(
    "/foregt-password",
    validate(forgetPasswordSchema),
    userServices.forgetPassword
);

router.patch(
    "/reset-password",
    validate(resetPasswordSchema),
    userServices.resetPassword
);

router.patch(
    "/profile-image",
    auth({
        accessRoles:endpoint.all
    }),
    cloudFileUpload().single("profileImage"),
    userServices.uploadProfileImage
)


export default router