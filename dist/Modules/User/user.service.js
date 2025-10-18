"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_handler_1 = require("../../Utils/Handlers/success.handler");
const user_validation_1 = require("./user.validation");
const token_reposetory_1 = require("../../DB/reposetories/token.reposetory");
const user_reposetory_1 = require("../../DB/reposetories/user.reposetory");
const jwt_utils_1 = require("../../Utils/Security/jwt.utils");
const user_model_1 = require("../../DB/Models/user.model");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
const hash_utils_1 = require("../../Utils/Security/hash.utils");
const otp_utils_1 = require("../../Utils/Security/otp.utils");
const email_event_1 = require("../../Utils/Events/email.event");
const s3_config_1 = require("../../Utils/upload/S3 Bucket/s3.config");
const friendRequest_reposetory_1 = require("../../DB/reposetories/friendRequest.reposetory");
class UserService {
    _userModel = new user_reposetory_1.UserReposetory();
    _tokenModel = new token_reposetory_1.TokenReposetory();
    _friendRequestModel = new friendRequest_reposetory_1.FriendRequestReposetory();
    constructor() { }
    getProfile = async (req, res, next) => {
        const { id } = req.params || undefined;
        let user;
        switch (true) {
            case (id && id == req.user?._id):
                user = req.user;
                break;
            case (!id && Boolean(req.user?._id)):
                user = req.user;
                break;
            case (Boolean(id)):
                user = await this._userModel.findOne({ filter: { _id: id, confirmedEmail: { $exists: true } } });
                break;
            default:
                throw new error_handler_1.NotFoundError({ message: "User not found" });
        }
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: { user } });
    };
    updateProfile = async (req, res, next) => {
        const updtedUser = await this._userModel.findOneAndUpdate({ filter: { _id: req.user?._id }, update: req.body });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: { updtedUser } });
    };
    changePassword = async (req, res, next) => {
        const { oldPassword, newPassword, flag } = req.body;
        if (!await (0, hash_utils_1.compareHash)({ data: oldPassword, hash: req.user?.password }))
            throw new error_handler_1.UnauthorizedError({ message: "wrong Password" });
        let credentials = {};
        switch (flag) {
            case user_validation_1.changePasswordFlag.ALL:
                await this._userModel.findOneAndUpdate({ filter: { _id: req.user?._id }, update: { password: newPassword, credentailsUpdatedAt: new Date() } });
                break;
            case user_validation_1.changePasswordFlag.KEEP_ME:
                await this._userModel.findOneAndUpdate({ filter: { _id: req.user?._id }, update: { password: newPassword, credentailsUpdatedAt: new Date() } });
                await this._tokenModel.revokeToken(req.decodedToken);
                credentials = await (0, jwt_utils_1.createCredentials)(req.user);
                break;
            case user_validation_1.changePasswordFlag.KEEP_ALL:
                await this._userModel.findOneAndUpdate({ filter: { _id: req.user?._id }, update: { password: newPassword } });
                break;
        }
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: credentials || undefined });
    };
    forgetPassword = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({ filter: { email, confirmedEmail: { $exists: true } }, select: "email passwordOTP", lean: true });
        if (!user)
            throw new error_handler_1.BadRequestError({ message: "Invalid Email" });
        if (user.passwordOTP?.createdAt < new Date(Date.now() - (1 * 60 * 1000)))
            throw new error_handler_1.BadRequestError({ message: "Please try again in 1 minute" });
        const otp = (0, otp_utils_1.generateOtp)();
        user.passwordOTP = {
            otp,
            createdAt: new Date()
        };
        await user.save();
        email_event_1.emailEvent.emit("resetPassword", {
            to: user.email,
            fullName: user.fullName,
            otp
        });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success" });
    };
    resetPassword = async (req, res, next) => {
        const { email, newPassword, otp } = req.body;
        const user = await this._userModel.findOne({ filter: { email, confirmedEmail: { $exists: true }, passwordOTP: { $exists: true } }, select: "email passwordOTP oldPasswords", lean: true });
        if (!user)
            throw new error_handler_1.BadRequestError({ message: "Invalid Email" });
        if (!await (0, hash_utils_1.compareHash)({ data: otp, hash: user.passwordOTP.otp }))
            throw new error_handler_1.UnauthorizedError({ message: "Invalid otp or expired" });
        if (user.passwordOTP.createdAt < new Date(Date.now() - (Number(process.env.CODE_EXPIRATION_TIME) * 60 * 1000)))
            throw new error_handler_1.UnauthorizedError({ message: "Invalid otp or expired" });
        if (user.oldPasswords.includes(newPassword))
            throw new error_handler_1.BadRequestError({ message: "can't use an old password" });
        await this._userModel.findOneAndUpdate({ filter: { email }, update: { password: newPassword, $unset: { passwordOTP: 1 }, credentailsUpdatedAt: new Date() } });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "otp sent to your email" });
    };
    uploadProfileImage = async (req, res, next) => {
        const data = await (0, s3_config_1.uploadFile)({
            file: req.file,
            path: `users/${req.user?._id}/profileImage`
        });
        if (req.user?.profileImage && !await (0, s3_config_1.deleteFiles)({ key: req.user?.profileImage }))
            throw new error_handler_1.AppError({ message: "Something went wrong" });
        if (!await this._userModel.findOneAndUpdate({
            filter: {
                _id: req.user?._id
            },
            update: {
                profileImage: data.key,
                $addToSet: { assets: data.key },
                $pull: { assets: req.user?.profileImage }
            }
        }))
            throw new error_handler_1.AppError({ message: "Something went wrong" });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data });
    };
    uploadCoverImages = async (req, res, next) => {
        const data = await (0, s3_config_1.uploadFile)({
            files: req.files,
            path: `users/${req.user?._id}/coverImages`
        });
        const keys = [...data.map(({ key }) => key)];
        if (!await this._userModel.findOneAndUpdate({
            filter: {
                _id: req.user?._id
            },
            update: {
                $addToSet: { assets: keys, coverImages: keys },
            }
        }))
            throw new error_handler_1.AppError({ message: "Something went wrong" });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data });
    };
    deleteAssets = async (req, res, next) => {
        const { key, keys } = req.body;
        let data = {};
        if (key) {
            if (!req.user?.assets?.includes(key))
                throw new error_handler_1.UnauthorizedError({ message: "you don't have permission" });
            data = await (0, s3_config_1.deleteFiles)({ key });
        }
        if (keys && keys.length > 0) {
            keys.forEach(k => {
                if (!req.user?.assets?.includes(k))
                    throw new error_handler_1.UnauthorizedError({ message: "you don't have permission" });
            });
            data = await (0, s3_config_1.deleteFiles)({ keys, Quiet: true });
        }
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data });
    };
    freezeAccount = async (req, res, next) => {
        if (!req.user)
            throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to freeze this account" });
        const { userId } = req.params;
        const { password } = req.body;
        if (!await (0, hash_utils_1.compareHash)({ data: password, hash: req.user.password }))
            throw new error_handler_1.BadRequestError({ message: "Invalid password" });
        let targetId;
        switch (true) {
            case (!userId):
                targetId = req.user._id;
                break;
            case (userId && req.user.role == user_model_1.RoleEnum.ADMIN):
                targetId = userId;
                break;
            default:
                throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to freeze this account" });
        }
        const user = await this._userModel.findOneAndUpdate({ filter: { _id: targetId, freezedAt: { $exists: false } }, update: { freezedAt: new Date(), freezedBy: req.user._id } });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "account deleted successfully", data: { user } });
    };
    restoreAccount = async (req, res, next) => {
        if (!req.user)
            throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to restore this account" });
        const { userId } = req.params;
        const { password } = req.body;
        if (!await (0, hash_utils_1.compareHash)({ data: password, hash: req.user.password }))
            throw new error_handler_1.BadRequestError({ message: "Invalid password" });
        let filter;
        switch (true) {
            case !userId:
                filter = { freezedAt: { $exists: true }, freezedBy: req.user._id, _id: req.user._id };
                break;
            case (userId && req.user.role == user_model_1.RoleEnum.ADMIN):
                filter = { freezedAt: { $exists: true }, freezedBy: { $ne: userId }, _id: userId };
                break;
            default:
                throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to restore this account" });
        }
        const user = await this._userModel.findOneAndUpdate({ filter, update: { $unset: { freezedAt: 1, freezedBy: 1 }, restoredAt: new Date(), restoredBy: req.user._id }, options: { new: true } });
        if (!user)
            throw new error_handler_1.NotFoundError({ message: "User not found" });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Post restored successfully", data: { user } });
    };
    deleteAccount = async (req, res, next) => {
        if (!req.user)
            throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to delete this account" });
        const { userId } = req.params;
        const { password } = req.body;
        if (!await (0, hash_utils_1.compareHash)({ data: password, hash: req.user.password }))
            throw new error_handler_1.BadRequestError({ message: "Invalid password" });
        let targetId;
        switch (true) {
            case (!userId):
                targetId = req.user._id;
                break;
            case (userId && req.user.role == user_model_1.RoleEnum.ADMIN):
                targetId = userId;
                break;
            default:
                throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to delete this account" });
        }
        const user = await this._userModel.deleteUser({ userId: targetId });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "account deleted successfully", data: { deletedUser: user } });
    };
    manageFriend = async (req, res, next) => {
        if (!req.user)
            throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to delete this account" });
        const { userId } = req.params;
        const friendRequest = await this._friendRequestModel.findOne({ filter: { createdBy: { $or: [req.user._id, userId] }, sendTo: { $or: [req.user._id, userId] } } });
        let message = "Success";
        let data = {};
        switch (true) {
            case !friendRequest:
                const sentRequest = await this._friendRequestModel.create({ data: [{ createdBy: req.user._id, sendTo: userId }] });
                message = "Friend request sent successfully";
                data = { sentRequest };
                break;
            case Boolean(friendRequest?.acceptedAt):
                await Promise.all([
                    this._userModel.updateOne({ filter: { _id: req.user._id }, update: { $pull: { friends: userId } } }),
                    this._userModel.updateOne({ filter: { _id: userId }, update: { $pull: { friends: req.user._id } } }),
                    this._friendRequestModel.deleteOne({ filter: { _id: friendRequest._id } })
                ]);
                message = "Friend removed successfully";
                data = undefined;
                break;
            case friendRequest && !friendRequest?.acceptedAt:
                await this._friendRequestModel.deleteOne({ filter: { _id: friendRequest._id } });
                message = "Friend request deleted successfully";
                data = undefined;
                break;
            default:
                throw new error_handler_1.BadRequestError({ message: "Something went wrong" });
        }
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message, data });
    };
    getFriendRequests = async (req, res, next) => {
        const friendRequests = await this._friendRequestModel.find({ filter: { sendTo: req.user?._id, acceptedAt: { $exists: false } } });
        const sentFriendRequests = await this._friendRequestModel.find({ filter: { createdBy: req.user?._id, acceptedAt: { $exists: false } } });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "account deleted successfully", data: { friendRequests, sentFriendRequests } });
    };
    respondToFriendRequest = async (req, res, next) => {
        const { friendRequestId } = req.params;
        const { response } = req.query;
        const filter = { _id: friendRequestId, sendTo: req.user?._id, acceptedAt: { $exists: false } };
        let message = "Success";
        let data = undefined;
        switch (response) {
            case user_validation_1.FriednRequestResponse.ACCEPT:
                const friendRequest = await this._friendRequestModel.findOneAndUpdate({ filter, update: { $set: { acceptedAt: new Date() } }, options: { new: true } });
                if (!friendRequest)
                    throw new error_handler_1.NotFoundError({ message: "Friend request not found" });
                await Promise.all([
                    this._userModel.updateOne({ filter: { _id: req.user?._id }, update: { $addToSet: { friends: friendRequest.createdBy } } }),
                    this._userModel.updateOne({ filter: { _id: friendRequest.createdBy }, update: { $addToSet: { friends: req.user?._id } } })
                ]);
                data = { friendRequest };
                message = "Friend request accepted successfully";
                break;
            case user_validation_1.FriednRequestResponse.REJECT:
                if (!await this._friendRequestModel.findOneAndDelete({ filter }))
                    throw new error_handler_1.NotFoundError({ message: "Friend request not found" });
                message = "Friend request rejected successfully";
                break;
            default:
                throw new error_handler_1.BadRequestError({ message: "Invalid response" });
        }
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message, data });
    };
}
exports.default = new UserService();
