import { NextFunction, Request, Response } from "express";
import { successHandler } from "../../Utils/Handlers/success.handler";
import { IgetProfileDTO, IlogoutDTO, IchangePasswordDTO, IupdateProfileDTO, IresetPasswordDTO, IforgetPasswordDTO } from "./user.dto";
import { changePasswordFlag, logoutFlag } from "./user.validation";
import { TokenReposetory } from "../../DB/reposetories/token.reposetory";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import { createCredentials, Credentials } from "../../Utils/Security/jwt.utils";
import { HUserDocument } from "../../DB/Models/user.model";
import { JwtPayload } from "jsonwebtoken";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../Utils/Handlers/error.handler";
import { compareHash, } from "../../Utils/Security/hash.utils";
import { generateOtp } from "../../Utils/Security/otp.utils";
import { emailEvent } from "../../Utils/Events/email.event";

class UserService {
    private _userModel = new UserReposetory();
    private _tokenModel = new TokenReposetory();
    constructor() { }
    public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {id} : IgetProfileDTO  = req.params || undefined
        const Tuser : HUserDocument|undefined = id == req.user?._id || !id ? req.user : await this._userModel.findOne({filter:{_id:id , confirmedEmail:{$exists:true}} , lean:true , select:"-__v -_id firstName middleName lastName email fullName role gender phone"});
        if(!Tuser)
            throw new NotFoundError({message:"User not found"});
        return successHandler({ res, statusCode: 200, message: "Success", data: {user: Tuser} });
    }
    public logout = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {flag} : IlogoutDTO = req.body;
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
        const credentials:Credentials = await createCredentials(req.user as HUserDocument);
        await this._tokenModel.revokeToken(req.decodedToken as JwtPayload);
        return successHandler({ res, statusCode: 201, message: "Success", data: credentials });
    }
    updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {fullName, phone,gender} : IupdateProfileDTO = req.body;
        const updtedUser = await this._userModel.findOneAndUpdate({filter:{_id:req.user?._id} , update:{fullName, phone,gender}});
        return successHandler({ res, statusCode: 200, message: "Success", data: {updtedUser} });
    }
    changePassword = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {oldPassword, newPassword,flag} : IchangePasswordDTO = req.body;
        if(! await compareHash({data:oldPassword, hash: req.user?.password as string}))
            throw new UnauthorizedError({message:"wrong Password"});
        let credentials:Credentials = {}
        switch (flag) {
            case changePasswordFlag.ALL:
                await this._userModel.findOneAndUpdate({filter:{_id:req.user?._id} , update:{password:newPassword , credentailsUpdatedAt:new Date()}});
                break;
            case changePasswordFlag.KEEP_ME:
                await this._userModel.findOneAndUpdate({filter:{_id:req.user?._id} , update:{password:newPassword , credentailsUpdatedAt:new Date()}});
                await this._tokenModel.revokeToken(req.decodedToken as JwtPayload);
                credentials = await createCredentials(req.user as HUserDocument);
                break;
            case changePasswordFlag.KEEP_ALL:
                await this._userModel.findOneAndUpdate({filter:{_id:req.user?._id} , update:{password:newPassword}});
                break;
        }
        return successHandler({ res, statusCode: 200, message: "Success" , data:credentials || undefined });
    }
    forgetPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {email} : IforgetPasswordDTO = req.body;
        const user:HUserDocument = await this._userModel.findOne({filter:{email , confirmedEmail:{$exists:true}} , select:"email passwordOTP" , lean:true});
        if(!user)
            throw new BadRequestError({message:"Invalid Email"});
        if(user.passwordOTP?.createdAt < new Date(Date.now() - (1 * 60 * 1000)))
           throw new BadRequestError({message:"Please try again in 1 minute"});
        const otp = generateOtp();
        user.passwordOTP = {
            otp,
            createdAt: new Date()
        };
        await user.save();
        emailEvent.emit("resetPassword", {
            to: user.email,
            fullName:user.fullName,
            otp
        });
        return successHandler({ res, statusCode: 200, message: "Success" });
    }
    resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {email,newPassword,otp} : IresetPasswordDTO = req.body;
        const user:HUserDocument = await this._userModel.findOne({filter:{email , confirmedEmail:{$exists:true} , passwordOTP:{$exists:true}} , select:"email passwordOTP oldPasswords" , lean:true});
        if(!user)
            throw new BadRequestError({message:"Invalid Email"});
        if(!await compareHash({data:otp , hash:user.passwordOTP.otp}))
            throw new UnauthorizedError({message:"Invalid otp or expired"});
        if(user.passwordOTP.createdAt < new Date(Date.now() - (Number(process.env.CODE_EXPIRATION_TIME) * 60 * 1000)))
            throw new UnauthorizedError({message:"Invalid otp or expired"});
        if(user.oldPasswords.includes(newPassword))
            throw new BadRequestError({message:"can't use an old password"});
        await this._userModel.findOneAndUpdate({filter:{email} , update:{password:newPassword , $unset:{passwordOTP:1}, credentailsUpdatedAt:new Date()}});
        return successHandler({ res, statusCode: 200, message: "otp sent to your email" });
    }
    uploadProfileImage = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        return successHandler({ res, statusCode: 200, message: "Success" , data: req.file });
    }
}

export default new UserService();