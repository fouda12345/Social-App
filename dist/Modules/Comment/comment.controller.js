"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_service_1 = __importDefault(require("./comment.service"));
const auth_middleware_1 = require("../../Middlewares/auth.middleware");
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
const cloud_multer_1 = require("../../Utils/upload/multer/cloud.multer");
const comment_validation_1 = require("./comment.validation");
const router = (0, express_1.Router)({
    mergeParams: true
});
router.post("/", (0, auth_middleware_1.auth)(), (0, cloud_multer_1.cloudFileUpload)({ filter: [...cloud_multer_1.fileFilter.image, ...cloud_multer_1.fileFilter.video], maxSize: 1024 }).array("attachments", 3), (0, validation_middleware_1.validate)(comment_validation_1.createCommentSchema), comment_service_1.default.createComment);
router.post("/:commentId/reply", (0, auth_middleware_1.auth)(), (0, cloud_multer_1.cloudFileUpload)({ filter: [...cloud_multer_1.fileFilter.image, ...cloud_multer_1.fileFilter.video], maxSize: 1024 }).array("attachments", 3), (0, validation_middleware_1.validate)(comment_validation_1.createReplyschema), comment_service_1.default.createComment);
router.patch("/:commentId", (0, auth_middleware_1.auth)(), (0, validation_middleware_1.validate)(comment_validation_1.createReplyschema), comment_service_1.default.updateComment);
router.patch("/freeze-comment/:commentId", (0, auth_middleware_1.auth)(), (0, validation_middleware_1.validate)(comment_validation_1.controlCommentSchema), comment_service_1.default.freezeComment);
router.patch("/restore-comment/:commentId", (0, auth_middleware_1.auth)(), (0, validation_middleware_1.validate)(comment_validation_1.controlCommentSchema), comment_service_1.default.restoreComment);
exports.default = router;
