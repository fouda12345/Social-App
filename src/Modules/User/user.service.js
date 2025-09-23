"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_handler_1 = require("../../Utils/Handlers/success.handler");
const user_validation_1 = require("./user.validation");
const token_reposetory_1 = require("../../DB/reposetories/token.reposetory");
const user_reposetory_1 = require("../../DB/reposetories/user.reposetory");
const jwt_utils_1 = require("../../Utils/Security/jwt.utils");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
const hash_utils_1 = require("../../Utils/Security/hash.utils");
const otp_utils_1 = require("../../Utils/Security/otp.utils");
const email_event_1 = require("../../Utils/Events/email.event");
class UserService {
    _userModel = new user_reposetory_1.UserReposetory();
    _tokenModel = new token_reposetory_1.TokenReposetory();
    constructor() { }
    getProfile = async (req, res, next) => {
        const { id } = req.params || undefined;
        const Tuser = id == req.user?._id || !id ? req.user : await this._userModel.findOne({ filter: { _id: id, confirmedEmail: { $exists: true } }, lean: true, select: "-__v -_id firstName middleName lastName email fullName role gender phone" });
        if (!Tuser)
            throw new error_handler_1.NotFoundError({ message: "User not found" });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: { user: Tuser } });
    };
    logout = async (req, res, next) => {
        const { flag } = req.body;
        let statusCode = 200;
        switch (flag) {
            case user_validation_1.logoutFlag.ALL:
                await this._userModel.findOneAndUpdate({
                    filter: { _id: req.decodedToken?._id },
                    update: { credentailsUpdatedAt: new Date() }
                });
                break;
            case user_validation_1.logoutFlag.ONLY:
                await this._tokenModel.revokeToken(req.decodedToken);
                statusCode = 201;
                break;
        }
        return (0, success_handler_1.successHandler)({ res, statusCode, message: "logged out successfully" });
    };
    refreshToken = async (req, res, next) => {
        const credentials = await (0, jwt_utils_1.createCredentials)(req.user);
        await this._tokenModel.revokeToken(req.decodedToken);
        return (0, success_handler_1.successHandler)({ res, statusCode: 201, message: "Success", data: credentials });
    };
    updateProfile = async (req, res, next) => {
        const { fullName, phone, gender } = req.body;
        const updtedUser = await this._userModel.findOneAndUpdate({ filter: { _id: req.user?._id }, update: { fullName, phone, gender } });
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
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: req.file });
    };
}
exports.default = new UserService();
