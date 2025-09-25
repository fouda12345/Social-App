import { Router } from "express";
import userServices from "./user.service";
import { auth } from "../../Middlewares/auth.middleware";
import { endpoint } from "./user.authorization";
import { validate } from "../../Middlewares/validation.middleware";
import { changePasswordSchema, coverImagesSchema, forgetPasswordSchema, getProfileSchema, profileImageSchema, resetPasswordSchema, updateProfileSchema } from "./user.validation";
import { cloudFileUpload, fileFilter, StorageApproach } from "../../Utils/upload/multer/cloud.multer";
const router   = Router();

router.get(
    "/profile{/:id}",
    auth({
        accessRoles:endpoint.all
    }),
    validate(getProfileSchema),
    userServices.getProfile
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
    cloudFileUpload({
        filter:fileFilter.image,
        maxSize:5,
        storageApproach:StorageApproach.DISK
    }).single("profileImage"),
    validate(profileImageSchema),
    userServices.uploadProfileImage
)

router.patch(
    "/covere-images",
    auth({
        accessRoles:endpoint.all
    }),
    cloudFileUpload({
        filter:fileFilter.image,
        maxSize:5,
        storageApproach:StorageApproach.DISK
    }).array("coverImage",5),
    validate(coverImagesSchema),
    userServices.uploadCoverImages
)

// router.get(
//     "/all-users",
//     auth({
//         accessRoles:endpoint.all
//     }),
//     userServices.getAllUsers
// )

export default router