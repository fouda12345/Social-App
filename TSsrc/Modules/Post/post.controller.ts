import { Router } from "express";
import postServices from "./post.service";
import { auth } from "../../Middlewares/auth.middleware";
import { validate } from "../../Middlewares/validation.middleware";
import { cloudFileUpload, fileFilter } from "../../Utils/upload/multer/cloud.multer";
import { createPostSchema, getSinglePostSchema, getPostsSchema, likePostSchema, sharePostSchema, updatePostSchema, controlPostSchema } from "./post.validation";
import commentRouter from "../Comment/comment.controller";
const router = Router();

router.use("/:postId/comment" , commentRouter )
router.post(
    "/",
    auth(),
    cloudFileUpload({filter:[...fileFilter.image,...fileFilter.video] , maxSize:1024}).array("attachments", 5),
    validate(createPostSchema),
    postServices.createPost
)

router.post(
    "/share/:postId",
    auth(),
    cloudFileUpload({filter:[...fileFilter.image,...fileFilter.video] , maxSize:1024}).array("attachments", 5),
    validate(sharePostSchema),
    postServices.sharePost,
    validate(createPostSchema),
    postServices.createPost
)

router.patch(
    "/:postId/like",
    auth(),
    validate(likePostSchema),
    postServices.likeAndUnlikePost
)

router.patch(
    "/:postId",
    auth(),
    cloudFileUpload({filter:[...fileFilter.image,...fileFilter.video] , maxSize:1024}).array("attachments", 5),
    validate(updatePostSchema),
    postServices.updatePost
)

router.get(
    "/",
    auth(),
    validate(getPostsSchema),
    postServices.getPosts
)

router.get(
    "/:postId",
    auth(),
    validate(getSinglePostSchema),
    postServices.getSinglePost
)

router.patch(
    "/freeze-post/:postId",
    auth(),
    validate(controlPostSchema),
    postServices.freezePost
)

router.patch(
    "/restore-post/:postId",
    auth(),
    validate(controlPostSchema),
    postServices.restorePost
)


export default router