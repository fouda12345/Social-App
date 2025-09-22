"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_handler_1 = require("../../Utils/Handlers/error.handler");
const user_reposetory_1 = require("../../DB/reposetories/user.reposetory");
const success_handler_1 = require("../../Utils/Handlers/success.handler");
const email_event_1 = require("../../Utils/Events/email.event");
const otp_utils_1 = require("../../Utils/Security/otp.utils");
const hash_utils_1 = require("../../Utils/Security/hash.utils");
const jwt_utils_1 = require("../../Utils/Security/jwt.utils");
class AuthService {
    _userModel = new user_reposetory_1.UserReposetory();
    constructor() { }
    signup = async (req, res, next) => {
        const { fullName, email, password, phone, gender } = req.body;
        const checkUser = await this._userModel.findOne({ filter: { email }, select: "email", lean: true });
        if (checkUser)
            throw new error_handler_1.ConflictError({ message: "User already exists", options: { cause: checkUser } });
        const user = await this._userModel.createUser({ data: { fullName, email, password, phone: phone, gender: gender } });
        const otp = (0, otp_utils_1.generateOtp)();
        user.emailOTP = {
            otp,
            createdAt: new Date()
        };
        await user.save();
        email_event_1.emailEvent.emit("confirmEmail", {
            to: user.email,
            fullName,
            otp
        });
        return (0, success_handler_1.successHandler)({ res, statusCode: 201, message: "User created successfully", data: user });
    };
    confirmEmail = async (req, res, next) => {
        const { otp, email } = req.body;
        const checkUser = await this._userModel.findOne({ filter: { email, confirmedEmail: { $exists: false }, emailOTP: { $exists: true } } });
        switch (true) {
            case !Boolean(checkUser):
                throw new error_handler_1.NotFoundError({ message: "User not found Invalid Email" });
            case checkUser.emailOTP.createdAt < new Date(Date.now() - (Number(process.env.CODE_EXPIRATION_TIME) * 60 * 1000)):
                throw new error_handler_1.BadRequestError({ message: "OTP expired" });
            case !await (0, hash_utils_1.compareHash)({ data: otp, hash: checkUser.emailOTP.otp }):
                throw new error_handler_1.BadRequestError({ message: "Invalid OTP" });
        }
        const user = await this._userModel.findOneAndUpdate({ filter: { email, confirmedEmail: { $exists: false }, emailOTP: { $exists: true } }, update: { confirmedEmail: new Date(), $unset: { emailOTP: 1 } } });
        if (!user)
            throw new error_handler_1.AppError({ message: "Error confirming email" });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Email verified successfully", data: user });
    };
    sendConfirmEmail = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({ filter: { email, confirmedEmail: { $exists: false } } });
        if (!user)
            throw new error_handler_1.NotFoundError({ message: "User not found Invalid Email" });
        if (user.emailOTP.createdAt > new Date(Date.now() - (1 * 60 * 1000)))
            throw new error_handler_1.BadRequestError({ message: "Please wait for 1 minute before sending another email" });
        const otp = (0, otp_utils_1.generateOtp)();
        user.emailOTP = {
            otp,
            createdAt: new Date()
        };
        await user.save();
        email_event_1.emailEvent.emit("confirmEmail", {
            to: user.email,
            fullName: user.fullName,
            otp
        });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Email sent successfully" });
    };
    login = async (req, res, next) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user || !await (0, hash_utils_1.compareHash)({ data: password, hash: user.password }))
            throw new error_handler_1.UnAuthorizedError();
        if (!user.confirmedEmail)
            throw new error_handler_1.BadRequestError({ message: "Please confirm your email" });
        const { accessToken, refreshToken } = await (0, jwt_utils_1.createCredentials)(user);
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Login successful", data: { accessToken, refreshToken } });
    };
}
exports.default = new AuthService();
