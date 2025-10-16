import { NextFunction, Request, Response } from "express";
import { successHandler } from "../../Utils/Handlers/success.handler";
import { IgetProfileDTO, IchangePasswordDTO, IresetPasswordDTO, IforgetPasswordDTO, IdeleteAssetDTO } from "./user.dto";
import { changePasswordFlag, FriednRequestResponse } from "./user.validation";
import { TokenReposetory } from "../../DB/reposetories/token.reposetory";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import { createCredentials, Credentials } from "../../Utils/Security/jwt.utils";
import { HUserDocument, IUser, RoleEnum } from "../../DB/Models/user.model";
import { JwtPayload } from "jsonwebtoken";
import { AppError, BadRequestError, NotFoundError, UnauthorizedError } from "../../Utils/Handlers/error.handler";
import { compareHash, } from "../../Utils/Security/hash.utils";
import { generateOtp } from "../../Utils/Security/otp.utils";
import { emailEvent } from "../../Utils/Events/email.event";
import { deleteFiles, IPresignedUrlData, uploadFile } from "../../Utils/upload/S3 Bucket/s3.config";
import { DeleteObjectCommandOutput, DeleteObjectsCommandOutput } from "@aws-sdk/client-s3";
import { RootFilterQuery, Types } from "mongoose";
import { FriendRequestReposetory } from "../../DB/reposetories/friendRequest.reposetory";
import { IFriendRequest } from "../../DB/Models/friendRequest.model";


class UserService {
    private _userModel = new UserReposetory();
    private _tokenModel = new TokenReposetory();
    private _friendRequestModel = new FriendRequestReposetory();
    constructor() { }
    getProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { id }: IgetProfileDTO = req.params || undefined
        let user: HUserDocument | null | undefined | IUser
        switch (true) {
            case (id && id == req.user?._id as unknown as string):
                user = req.user
                break;
            case (!id && Boolean(req.user?._id)):
                user = req.user
                break;
            case (Boolean(id)):
                user = await this._userModel.findOne({ filter: { _id: id, confirmedEmail: { $exists: true } } });
                break;
            default:
                throw new NotFoundError({ message: "User not found" });
        }
        return successHandler({ res, statusCode: 200, message: "Success", data: { user } });
    }
    updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const updtedUser = await this._userModel.findOneAndUpdate({ filter: { _id: req.user?._id }, update: req.body });
        return successHandler({ res, statusCode: 200, message: "Success", data: { updtedUser } });
    }
    changePassword = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { oldPassword, newPassword, flag }: IchangePasswordDTO = req.body;
        if (! await compareHash({ data: oldPassword, hash: req.user?.password as string }))
            throw new UnauthorizedError({ message: "wrong Password" });
        let credentials: Credentials = {}
        switch (flag) {
            case changePasswordFlag.ALL:
                await this._userModel.findOneAndUpdate({ filter: { _id: req.user?._id }, update: { password: newPassword, credentailsUpdatedAt: new Date() } });
                break;
            case changePasswordFlag.KEEP_ME:
                await this._userModel.findOneAndUpdate({ filter: { _id: req.user?._id }, update: { password: newPassword, credentailsUpdatedAt: new Date() } });
                await this._tokenModel.revokeToken(req.decodedToken as JwtPayload);
                credentials = await createCredentials(req.user as HUserDocument);
                break;
            case changePasswordFlag.KEEP_ALL:
                await this._userModel.findOneAndUpdate({ filter: { _id: req.user?._id }, update: { password: newPassword } });
                break;
        }
        return successHandler({ res, statusCode: 200, message: "Success", data: credentials || undefined });
    }
    forgetPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { email }: IforgetPasswordDTO = req.body;
        const user = await this._userModel.findOne({ filter: { email, confirmedEmail: { $exists: true } }, select: "email passwordOTP", lean: true }) as HUserDocument;
        if (!user)
            throw new BadRequestError({ message: "Invalid Email" });
        if (user.passwordOTP?.createdAt < new Date(Date.now() - (1 * 60 * 1000)))
            throw new BadRequestError({ message: "Please try again in 1 minute" });
        const otp = generateOtp();
        user.passwordOTP = {
            otp,
            createdAt: new Date()
        };
        await user.save();
        emailEvent.emit("resetPassword", {
            to: user.email,
            fullName: user.fullName,
            otp
        });
        return successHandler({ res, statusCode: 200, message: "Success" });
    }
    resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { email, newPassword, otp }: IresetPasswordDTO = req.body;
        const user = await this._userModel.findOne({ filter: { email, confirmedEmail: { $exists: true }, passwordOTP: { $exists: true } }, select: "email passwordOTP oldPasswords", lean: true });
        if (!user)
            throw new BadRequestError({ message: "Invalid Email" });
        if (!await compareHash({ data: otp, hash: user.passwordOTP.otp }))
            throw new UnauthorizedError({ message: "Invalid otp or expired" });
        if (user.passwordOTP.createdAt < new Date(Date.now() - (Number(process.env.CODE_EXPIRATION_TIME) * 60 * 1000)))
            throw new UnauthorizedError({ message: "Invalid otp or expired" });
        if (user.oldPasswords.includes(newPassword))
            throw new BadRequestError({ message: "can't use an old password" });
        await this._userModel.findOneAndUpdate({ filter: { email }, update: { password: newPassword, $unset: { passwordOTP: 1 }, credentailsUpdatedAt: new Date() } });
        return successHandler({ res, statusCode: 200, message: "otp sent to your email" });
    }
    uploadProfileImage = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const data: { key: string } | { url: string, key: string } = await uploadFile({
            file: req.file as Express.Multer.File | IPresignedUrlData,
            path: `users/${req.user?._id}/profileImage`
        })
        if (req.user?.profileImage && !await deleteFiles({ key: req.user?.profileImage }))
            throw new AppError({ message: "Something went wrong" });

        if (
            !await this._userModel.findOneAndUpdate({
                filter: {
                    _id: req.user?._id
                },
                update: {
                    profileImage: data.key,
                    $addToSet: { assets: data.key },
                    $pull: { assets: req.user?.profileImage }
                }
            })
        )
            throw new AppError({ message: "Something went wrong" });
        return successHandler({ res, statusCode: 200, message: "Success", data });
    }
    uploadCoverImages = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const data: { key: string }[] | { url: string, key: string }[] = await uploadFile({
            files: req.files as Express.Multer.File[] | IPresignedUrlData[],
            path: `users/${req.user?._id}/coverImages`
        })
        const keys: string[] = [...data.map(({ key }) => key)]
        if (
            !await this._userModel.findOneAndUpdate({
                filter: {
                    _id: req.user?._id
                },
                update: {
                    $addToSet: { assets: keys , coverImages: keys},
                }
            })
        )
            throw new AppError({ message: "Something went wrong" });
        return successHandler({ res, statusCode: 200, message: "Success", data });
    }
    deleteAssets = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { key, keys }: IdeleteAssetDTO = req.body;
        let data: DeleteObjectCommandOutput | DeleteObjectsCommandOutput | {} = {}
        if (key) {
            if (!req.user?.assets?.includes(key))
                throw new UnauthorizedError({ message: "you don't have permission" });
            data = await deleteFiles({ key });
        }
        if (keys && keys.length > 0) {
            keys.forEach(k => {
                if (!req.user?.assets?.includes(k))
                    throw new UnauthorizedError({ message: "you don't have permission" });
            })
            data = await deleteFiles({ keys, Quiet: true });
        }
        return successHandler({ res, statusCode: 200, message: "Success", data });
    }
    freezeAccount = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to freeze this account" })
        const { userId } = req.params
        const { password } = req.body
        if (!await compareHash({ data: password, hash: req.user.password as string }))
            throw new BadRequestError({ message: "Invalid password" })
        let targetId
        switch (true) {
            case (!userId):
                targetId = req.user._id
                break;
            case (userId && req.user.role == RoleEnum.ADMIN):
                targetId = userId
                break;
            default:
                throw new UnauthorizedError({ message: "You are not authorized to freeze this account" })
        }
        const user = await this._userModel.findOneAndUpdate({ filter:{_id:targetId , freezedAt:{$exists:false}},update:{freezedAt:new Date(),freezedBy:req.user._id}})
        return successHandler({ res, statusCode: 200, message: "account deleted successfully", data: { user } });
    }

    restoreAccount = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to restore this account" })
        const { userId } = req.params
        const { password } = req.body
        if (!await compareHash({ data: password, hash: req.user.password as string }))
            throw new BadRequestError({ message: "Invalid password" })
        let filter : RootFilterQuery<IUser>
        switch (true) {
            case !userId:
                filter = { freezedAt: { $exists: true }, freezedBy: req.user._id , _id : req.user._id}
                break;
            case (userId && req.user.role == RoleEnum.ADMIN):
                filter = { freezedAt: { $exists: true }, freezedBy: {$ne : userId} , _id : userId}
                break;
            default:
                throw new UnauthorizedError({ message: "You are not authorized to restore this account" })
        }
        const user = await this._userModel.findOneAndUpdate({ filter, update: { $unset: { freezedAt: 1, freezedBy: 1 }, restoredAt: new Date(), restoredBy: req.user._id }, options: { new: true } })
        if (!user) throw new NotFoundError({ message: "User not found" })
        return successHandler({ res, statusCode: 200, message: "Post restored successfully", data: { user } });
    }

    deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to delete this account" })
        const { userId } = req.params
        const { password } = req.body
        if (!await compareHash({ data: password, hash: req.user.password as string }))
            throw new BadRequestError({ message: "Invalid password" })
        let targetId
        switch (true) {
            case (!userId):
                targetId = req.user._id
                break;
            case (userId && req.user.role == RoleEnum.ADMIN):
                targetId = userId
                break;
            default:
                throw new UnauthorizedError({ message: "You are not authorized to delete this account" })
        }
        const user = await this._userModel.deleteUser({ userId: targetId as string })
        return successHandler({ res, statusCode: 200, message: "account deleted successfully", data: { deletedUser: user } });
    }

    manageFriend = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to delete this account" })
        const { userId }  = req.params as unknown as  { userId: Types.ObjectId }
        const friendRequest = await this._friendRequestModel.findOne({ filter: { createdBy: {$or : [req.user._id, userId]}, sendTo: {$or : [req.user._id, userId]} } })
        let message = "Success";
        let data : any= {}
        switch (true){
            case !friendRequest:
                const sentRequest = await this._friendRequestModel.create({ data: [{createdBy: req.user._id,sendTo: userId}] })
                message = "Friend request sent successfully"
                data = { sentRequest }
                break;
            case Boolean(friendRequest?.acceptedAt):
                await Promise.all([
                    this._userModel.updateOne({ filter: { _id: req.user._id }, update: { $pull: { friends: userId } } }),
                    this._userModel.updateOne({ filter: { _id: userId }, update: { $pull: { friends: req.user._id } } }),
                    this._friendRequestModel.deleteOne({ filter: { _id: friendRequest._id } })
                ])
                message = "Friend removed successfully"
                data = undefined
                break;
            case friendRequest && !friendRequest?.acceptedAt:
                await this._friendRequestModel.deleteOne({ filter: { _id: friendRequest._id } })
                message = "Friend request deleted successfully"
                data = undefined
                break;
            default:
                throw new BadRequestError({ message: "Something went wrong" })
        }
        return successHandler({ res, statusCode: 200, message, data });
    }

    getFriendRequests = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const friendRequests = await this._friendRequestModel.find({ filter: { sendTo: req.user?._id , acceptedAt : {$exists : false}} })
        const sentFriendRequests = await this._friendRequestModel.find({ filter: { createdBy: req.user?._id , acceptedAt : {$exists : false}} })
        return successHandler({ res, statusCode: 200, message: "account deleted successfully", data: { friendRequests , sentFriendRequests} });
    }

    respondToFriendRequest = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { friendRequestId } = req.params as unknown as { friendRequestId: Types.ObjectId }
        const { response } = req.query as { response: FriednRequestResponse }
        const filter : RootFilterQuery<IFriendRequest> = { _id: friendRequestId , sendTo: req.user?._id , acceptedAt : {$exists : false} }
        let message : string = "Success"
        let data : any = undefined
        switch (response){
            case FriednRequestResponse.ACCEPT:
                const friendRequest = await this._friendRequestModel.findOneAndUpdate({ filter , update : { $set : { acceptedAt : new Date() }} , options : { new : true } })
                if (!friendRequest) throw new NotFoundError({ message: "Friend request not found" })
                data = { friendRequest }
                message = "Friend request accepted successfully"
                break;
            case FriednRequestResponse.REJECT:
                if (!await this._friendRequestModel.findOneAndDelete({ filter})) throw new NotFoundError({ message: "Friend request not found" })
                message = "Friend request rejected successfully"
                break;
            default:
                throw new BadRequestError({ message: "Invalid response" })
        }
        return successHandler({ res, statusCode: 200, message, data });
    }
}

export default new UserService();