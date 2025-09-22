import type { Request , Response , NextFunction, RequestHandler } from "express";
import { AppError, BadRequestError, ConflictError, NotFoundError, UnAuthorizedError } from "../../Utils/Handlers/error.handler";
import { IConfirmEmailDTO, ILoginDTO, ISendConfirmEmailDTO, ISignUpDTO } from "./auth.dto";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import { successHandler } from "../../Utils/Handlers/success.handler";
import { emailEvent } from "../../Utils/Events/email.event";
import { generateOtp } from "../../Utils/Security/otp.utils";
import { compareHash } from "../../Utils/Security/hash.utils";
import { GenderEnum, IUser, RoleEnum } from "../../DB/Models/user.model";
import { HydratedDocument } from "mongoose";
import { generateToken, getSecretAndExpireTimefromRole, StringValue } from "../../Utils/Security/jwt.utils";


class AuthService {
    private _userModel = new UserReposetory();
    constructor() {}
    public signup : RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {fullName, email, password , phone,gender} : ISignUpDTO = req.body;

        const checkUser = await this._userModel.findOne({filter:{email} , select:"email" , lean:true});

        if (checkUser) throw new ConflictError({message:"User already exists" , options:{cause:checkUser}});

        const user = await this._userModel.createUser({data:{fullName, email, password , phone:phone as string ,gender:gender as GenderEnum }});

        const otp = generateOtp();

        user.emailOTP = {
            otp,
            createdAt: new Date()
        };

        await user.save();

        emailEvent.emit("confirmEmail", {
            to: user.email,
            fullName,
            otp
        });

        return successHandler({res, statusCode: 201, message:"User created successfully", data:user});
    }

    public confirmEmail : RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {otp ,email} : IConfirmEmailDTO  = req.body;

        const checkUser = await this._userModel.findOne({filter:{email , confirmedEmail:{$exists:false} , emailOTP:{$exists:true}}});

        switch (true) {
            case !Boolean(checkUser):
                throw new NotFoundError({message:"User not found Invalid Email"});
            case checkUser.emailOTP.createdAt < new Date(Date.now() - (Number(process.env.CODE_EXPIRATION_TIME) * 60 * 1000)):
                throw new BadRequestError({message:"OTP expired"});
            case ! await compareHash({data:otp , hash:checkUser.emailOTP.otp}):
                throw new BadRequestError({message:"Invalid OTP"});
        }
        
        const user =await this._userModel.findOneAndUpdate({filter:{email , confirmedEmail:{$exists:false} , emailOTP:{$exists:true}} , update:{confirmedEmail:new Date() , $unset:{emailOTP:1}}});
        if (!user) throw new AppError({message:"Error confirming email"});

        return successHandler({res, statusCode: 200, message:"Email verified successfully", data:user});
    }

    public sendConfirmEmail : RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {email} : ISendConfirmEmailDTO  = req.body;

        const user = await this._userModel.findOne({filter:{email , confirmedEmail:{$exists:false}}});
        if (!user) throw new NotFoundError({message:"User not found Invalid Email"});

        
        if (user.emailOTP.createdAt > new Date(Date.now() - (1 * 60 * 1000))) 
            throw new BadRequestError({message:"Please wait for 1 minute before sending another email"});
        
        const otp:string = generateOtp();

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
        
        return successHandler({res, statusCode: 200, message:"Email sent successfully"});
    }

    public login : RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {

        const {email , password} : ILoginDTO = req.body;

        const user = await this._userModel.findOne({filter:{email}});
        if (!user ||!await compareHash({data:password , hash:user.password}) ) throw new UnAuthorizedError();
        if (!user.confirmedEmail) throw new BadRequestError({message:"Please confirm your email"});

        const {accessToken , refreshToken} : {accessToken: string ,refreshToken:string} = await this._createToken(user);
        return successHandler({res, statusCode: 200, message:"Login successful" , data:{accessToken , refreshToken}});
    }

    private _createToken  = async (user: HydratedDocument<IUser>) : Promise<{accessToken: string ,refreshToken:string}> => {
        const {accessSecret , accessExpireTime,refreshSecret , refreshExpireTime}
            : {accessSecret: string , accessExpireTime: StringValue , refreshSecret: string , refreshExpireTime: StringValue}
            = getSecretAndExpireTimefromRole(user.role as RoleEnum)
        return {
            accessToken: await generateToken({
                payload: {
                    id:user._id,
                },
                secret: accessSecret,
                options: {
                    expiresIn: accessExpireTime
                }                
            }) ,
            refreshToken: await generateToken({
                payload: {
                    id:user._id,
                },
                secret: refreshSecret,
                options: {
                    expiresIn: refreshExpireTime
                }
            })
        }
    }
}

export default new AuthService();