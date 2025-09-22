import { Router } from "express";
import authServices from "./auth.service";
import { validate } from "../../Middlewares/validation.middleware";
import { confirmEmailSchema, loginSchema, sendConfirmEmailSchema, signupSchema } from "./auth.validation";


const router: Router = Router();

router.post("/register",validate(signupSchema), authServices.signup);
router.post("/confirm-email", validate(confirmEmailSchema), authServices.confirmEmail);
router.post("/send-confirm-email", validate(sendConfirmEmailSchema), authServices.sendConfirmEmail);
router.post("/login",validate(loginSchema), authServices.login);


export default router;