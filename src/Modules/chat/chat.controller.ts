import { Router } from "express";
import { auth } from "../../Middlewares/auth.middleware";
import { validate } from "../../Middlewares/validation.middleware";
import chatService from "./chat.service";
import * as validators from "./chat.validation"
const router: Router = Router({
    mergeParams: true
});

router.get(
    "/group/:groupId",
    auth(),
    validate(validators.getGroupSchema),
    chatService.getGroupChat
)

router.get(
    "/:userId",
    auth(),
    validate(validators.getChatSchema),
    chatService.getChat
)

router.post(
    "/group",
    auth(),
    validate(validators.createGroupSchema),
    chatService.createGroupChat
)

export default router