import { Router } from "express";
import commentServices from "./comment.service";
import { auth } from "../../Middlewares/auth.middleware";
import { validate } from "../../Middlewares/validation.middleware";
import { cloudFileUpload, fileFilter } from "../../Utils/upload/multer/cloud.multer";
import { controlCommentSchema, createCommentSchema, createReplyschema } from "./comment.validation";
const router = Router({
    mergeParams: true
});

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

router.patch(
    "/freeze-comment/:commentId",
    auth(),
    validate(controlCommentSchema),
    commentServices.freezeComment
)

router.patch(
    "/restore-comment/:commentId",
    auth(),
    validate(controlCommentSchema),
    commentServices.restoreComment
)

export default router