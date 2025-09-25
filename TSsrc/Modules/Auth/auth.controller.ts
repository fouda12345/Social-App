import { Router } from "express";
import authServices from "./auth.service";
import { validate } from "../../Middlewares/validation.middleware";
import { confirmEmailSchema, loginSchema, sendConfirmEmailSchema, signupSchema } from "./auth.validation";
import { logoutSchema } from "../User/user.validation";
import { auth } from "../../Middlewares/auth.middleware";
import { TokenType } from "../../Utils/Security/jwt.utils";
import { endpoint } from "../User/user.authorization";


const router: Router = Router();

router.post("/register",validate(signupSchema), authServices.signup);
router.post("/confirm-email", validate(confirmEmailSchema), authServices.confirmEmail);
router.post("/send-confirm-email", validate(sendConfirmEmailSchema), authServices.sendConfirmEmail);
router.post("/login",validate(loginSchema), authServices.login);
router.post(
    "/logout",
    auth({
        accessRoles:endpoint.all
    }),
    validate(logoutSchema),
    authServices.logout
);

router.get(
    "/refresh-token",
    auth({
        tokenType:TokenType.REFRESH,
        accessRoles:endpoint.all
    }),
    authServices.refreshToken
);


export default router;