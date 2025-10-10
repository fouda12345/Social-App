"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_service_1 = __importDefault(require("./post.service"));
const auth_middleware_1 = require("../../Middlewares/auth.middleware");
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const cloud_multer_1 = require("../../Utils/upload/multer/cloud.multer");
const post_validation_1 = require("./post.validation");
const router = (0, express_1.Router)();
router.post("/", (0, auth_middleware_1.auth)(), (0, cloud_multer_1.cloudFileUpload)({ filter: [...cloud_multer_1.fileFilter.image, ...cloud_multer_1.fileFilter.video], maxSize: 1024 }).array("attachments", 5), (0, validation_middleware_1.validate)(post_validation_1.createPostSchema), post_service_1.default.createPost);
router.patch("/:postId", (0, auth_middleware_1.auth)(), (0, validation_middleware_1.validate)(post_validation_1.updatePostSchema), post_service_1.default.createPost);
exports.default = router;
