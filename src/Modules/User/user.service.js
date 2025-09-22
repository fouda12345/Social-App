"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_handler_1 = require("../../Utils/Handlers/success.handler");
const user_validation_1 = require("./user.validation");
const token_reposetory_1 = require("../../DB/reposetories/token.reposetory");
const user_reposetory_1 = require("../../DB/reposetories/user.reposetory");
const jwt_utils_1 = require("../../Utils/Security/jwt.utils");
class UserService {
    _userModel = new user_reposetory_1.UserReposetory();
    _tokenModel = new token_reposetory_1.TokenReposetory();
    constructor() { }
    getProfile = async (req, res, next) => {
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: { user: req.user, decodedToken: req.decodedToken } });
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
}
exports.default = new UserService();
