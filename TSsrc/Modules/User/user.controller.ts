import { Router } from "express";
import userServices from "./user.service";
import { auth } from "../../Middlewares/auth.middleware";
import { validate } from "../../Middlewares/validation.middleware";
import { changePasswordSchema, coverImagesSchema, forgetPasswordSchema, getProfileSchema, profileImageSchema, resetPasswordSchema, updateProfileSchema } from "./user.validation";
import { cloudFileUpload, fileFilter, StorageApproach } from "../../Utils/upload/multer/cloud.multer";
const router = Router();

router.get(
    "/profile{/:id}",
    auth({
        required: false
    }),
    validate(getProfileSchema),
    userServices.getProfile
);

router.patch(
    "/update-profile",
    auth(),
    validate(updateProfileSchema),
    userServices.updateProfile
);

router.patch(
    "/change-password",
    auth(),
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
    auth(),
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
    auth(),
    cloudFileUpload({
        filter:fileFilter.image,
        maxSize:5,
        storageApproach:StorageApproach.DISK
    }).array("coverImage",5),
    validate(coverImagesSchema),
    userServices.uploadCoverImages
)

router.delete(
    "/delete-asset",
    auth(),
    userServices.deleteAssets
)

export default router