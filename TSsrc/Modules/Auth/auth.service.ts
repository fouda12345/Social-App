import type { Request, Response, NextFunction, RequestHandler } from "express";
import { AppError, BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../../Utils/Handlers/error.handler";
import { IConfirmEmailDTO, ILoginDTO, ISendConfirmEmailDTO, ISignUpDTO } from "./auth.dto";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import { successHandler } from "../../Utils/Handlers/success.handler";
import { emailEvent } from "../../Utils/Events/email.event";
import { generateOtp } from "../../Utils/Security/otp.utils";
import { compareHash } from "../../Utils/Security/hash.utils";
import { HUserDocument } from "../../DB/Models/user.model";
import { createCredentials, Credentials } from "../../Utils/Security/jwt.utils";
import { IlogoutDTO } from "./auth.dto"; 
import { logoutFlag } from "./auth.validation"; 
import { JwtPayload } from "jsonwebtoken";
import { TokenReposetory } from "../../DB/reposetories/token.reposetory";


class AuthService {
    private _userModel = new UserReposetory();
    private _tokenModel = new TokenReposetory();
    constructor() { }
    public signup: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {email}: ISignUpDTO = req.body;

        const checkUser = await this._userModel.findOne({ filter: { email }, select: "email", lean: true });

        if (checkUser) throw new ConflictError({ message: "User already exists", options: { cause: checkUser } });

        const user = await this._userModel.createUser({ data: { ...req.body}});

        const otp = generateOtp();

        user.emailOTP = {
            otp,
            createdAt: new Date()
        };

        await user.save();

        emailEvent.emit("confirmEmail", {
            to: user.email,
            fullName: user.fullName,
            otp
        });

        return successHandler({ res, statusCode: 201, message: "User created successfully", data: user });
    }

    public confirmEmail: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { otp, email }: IConfirmEmailDTO = req.body;

        const checkUser = await this._userModel.findOne({ filter: { email, confirmedEmail: { $exists: false }, emailOTP: { $exists: true } } });

        switch (true) {
            case !Boolean(checkUser):
                throw new NotFoundError({ message: "User not found Invalid Email" });
            case checkUser.emailOTP.createdAt < new Date(Date.now() - (Number(process.env.CODE_EXPIRATION_TIME) * 60 * 1000)):
                throw new BadRequestError({ message: "Invalid OTP/OTP expired" });
            case ! await compareHash({ data: otp, hash: checkUser.emailOTP.otp }):
                throw new BadRequestError({ message: "Invalid OTP/OTP expired" });
        }

        if (!await this._userModel.findOneAndUpdate({ filter: { email, confirmedEmail: { $exists: false }, emailOTP: { $exists: true } }, update: { confirmedEmail: new Date(), $unset: { emailOTP: 1 } } }))
            throw new AppError({ message: "Error confirming email" });

        return successHandler({ res, statusCode: 200, message: "Email verified successfully" });
    }

    public sendConfirmEmail: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { email }: ISendConfirmEmailDTO = req.body;

        const user = await this._userModel.findOne({ filter: { email, confirmedEmail: { $exists: false } } });
        if (!user) throw new NotFoundError({ message: "User not found Invalid Email" });


        if (user.emailOTP.createdAt > new Date(Date.now() - (1 * 60 * 1000)))
            throw new BadRequestError({ message: "Please wait for 1 minute before sending another email" });

        const otp: string = generateOtp();

        user.emailOTP = {
            otp,
            createdAt: new Date()
        };

        await user.save();

        emailEvent.emit("confirmEmail", {
            to: user.email,
            fullName: user.fullName,
            otp
        });

        return successHandler({ res, statusCode: 200, message: "Email sent successfully" });
    }

    public login: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {

        const { email, password }: ILoginDTO = req.body;

        const user = await this._userModel.findOne({ filter: { email } });
        if (!user || !await compareHash({ data: password, hash: user.password })) throw new UnauthorizedError();
        if (!user.confirmedEmail) throw new BadRequestError({ message: "Please confirm your email" });

        const Credentials: Credentials = await createCredentials(user);
        return successHandler({ res, statusCode: 200, message: "Login successful", data: Credentials });
    }

    public logout = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { flag }: IlogoutDTO = req.body;
        let statusCode = 200;
        switch (flag) {
            case logoutFlag.ALL:
                await this._userModel.findOneAndUpdate({
                    filter: { _id: req.decodedToken?._id },
                    update: { credentailsUpdatedAt: new Date() }
                })
                break;
            case logoutFlag.ONLY:
                await this._tokenModel.revokeToken(req.decodedToken as JwtPayload);
                statusCode = 201
                break;
        }
        return successHandler({ res, statusCode, message: "logged out successfully" });
    }
    public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const credentials: Credentials = await createCredentials(req.user as HUserDocument);
        await this._tokenModel.revokeToken(req.decodedToken as JwtPayload);
        return successHandler({ res, statusCode: 201, message: "Success", data: credentials });
    }
}

export default new AuthService();