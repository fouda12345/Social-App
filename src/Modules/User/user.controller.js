"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const auth_middleware_1 = require("../../Middlewares/auth.middleware");
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const user_validation_1 = require("./user.validation");
const cloud_multer_1 = require("../../Utils/upload/multer/cloud.multer");
const router = (0, express_1.Router)();
router.get("/profile{/:id}", (0, auth_middleware_1.auth)({
    required: false
}), (0, validation_middleware_1.validate)(user_validation_1.getProfileSchema), user_service_1.default.getProfile);
router.patch("/update-profile", (0, auth_middleware_1.auth)(), (0, validation_middleware_1.validate)(user_validation_1.updateProfileSchema), user_service_1.default.updateProfile);
router.patch("/change-password", (0, auth_middleware_1.auth)(), (0, validation_middleware_1.validate)(user_validation_1.changePasswordSchema), user_service_1.default.changePassword);
router.post("/foregt-password", (0, validation_middleware_1.validate)(user_validation_1.forgetPasswordSchema), user_service_1.default.forgetPassword);
router.patch("/reset-password", (0, validation_middleware_1.validate)(user_validation_1.resetPasswordSchema), user_service_1.default.resetPassword);
router.patch("/profile-image", (0, auth_middleware_1.auth)(), (0, cloud_multer_1.cloudFileUpload)({
    filter: cloud_multer_1.fileFilter.image,
    maxSize: 5,
    storageApproach: cloud_multer_1.StorageApproach.DISK
}).single("profileImage"), (0, validation_middleware_1.validate)(user_validation_1.profileImageSchema), user_service_1.default.uploadProfileImage);
router.patch("/covere-images", (0, auth_middleware_1.auth)(), (0, cloud_multer_1.cloudFileUpload)({
    filter: cloud_multer_1.fileFilter.image,
    maxSize: 5,
    storageApproach: cloud_multer_1.StorageApproach.DISK
}).array("coverImage", 5), (0, validation_middleware_1.validate)(user_validation_1.coverImagesSchema), user_service_1.default.uploadCoverImages);
router.delete("/delete-asset", (0, auth_middleware_1.auth)(), user_service_1.default.deleteAssets);
exports.default = router;
