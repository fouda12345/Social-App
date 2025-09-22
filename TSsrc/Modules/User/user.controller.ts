import { Router } from "express";
import userServices from "./user.service";
import { auth } from "../../Middlewares/auth.middleware";
import { endpoint } from "./user.authorization";
import { TokenType } from "../../Utils/Security/jwt.utils";
const router   = Router();

router.get(
    "/profile",
    auth({
        accessRoles:endpoint.all
    }),
    userServices.getProfile
);

router.post(
    "/logout",
    auth({
        accessRoles:endpoint.all
    }),
    userServices.logout
);

router.get(
    "/refresh-token",
    auth({
        tokenType:TokenType.REFRESH,
        accessRoles:endpoint.all
    }),
    userServices.refreshToken
);

export default router