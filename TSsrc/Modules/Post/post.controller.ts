import { Router } from "express";
import postServices from "./post.service";
import { auth } from "../../Middlewares/auth.middleware";
import { validate } from "../../Middlewares/validation.middleware";
import { cloudFileUpload, fileFilter } from "../../Utils/upload/multer/cloud.multer";
import { createPostSchema, updatePostSchema } from "./post.validation";
const router = Router();


router.post(
    "/",
    auth(),
    cloudFileUpload({filter:[...fileFilter.image,...fileFilter.video] , maxSize:1024}).array("attachments", 5),
    validate(createPostSchema),
    postServices.createPost
)

router.patch(
    "/:postId",
    auth(),
    validate(updatePostSchema),
    postServices.createPost
)

export default router