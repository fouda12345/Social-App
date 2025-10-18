"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenReposetory = void 0;
const DB_reposetory_1 = require("./DB.reposetory");
const token_model_1 = require("../Models/token.model");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
class TokenReposetory extends DB_reposetory_1.DBReposetory {
    model;
    constructor(model = token_model_1.tokenModel) {
        super(model);
        this.model = model;
    }
    revokeToken = async (decodedToken) => {
        const [token] = await this.create({
            data: [
                {
                    jti: decodedToken.jti,
                    expiresIn: decodedToken.exp,
                    userId: decodedToken._id
                }
            ],
            options: { validateBeforeSave: true }
        }) || [];
        if (!token) {
            throw new error_handler_1.AppError({ message: "Error revoking token" });
        }
        return token;
    };
}
exports.TokenReposetory = TokenReposetory;
