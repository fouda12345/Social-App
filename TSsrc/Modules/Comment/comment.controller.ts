import { Router } from "express";
import commentServices from "./comment.service";
import { auth } from "../../Middlewares/auth.middleware";
import { validate } from "../../Middlewares/validation.middleware";
import { cloudFileUpload, fileFilter } from "../../Utils/upload/multer/cloud.multer";
import { createCommentSchema, createReplyschema } from "./comment.validation";
const router = Router();

router.post(
    "/",
    auth(),
    cloudFileUpload({filter:[...fileFilter.image,...fileFilter.video] , maxSize:1024}).array("attachments", 3),
    validate(createCommentSchema),
    commentServices.createComment
)

router.post(
    "/:commentId/reply",
    auth(),
    cloudFileUpload({filter:[...fileFilter.image,...fileFilter.video] , maxSize:1024}).array("attachments", 3),
    validate(createReplyschema),
    commentServices.createComment
)

router.patch(
    "/:commentId",
    auth(),
    validate(createReplyschema),
    commentServices.updateComment
)

export default router