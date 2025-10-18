"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserReposetory = void 0;
const user_model_1 = require("../Models/user.model");
const DB_reposetory_1 = require("./DB.reposetory");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
const post_model_1 = require("../Models/post.model");
const comment_model_1 = require("../Models/comment.model");
const s3_config_1 = require("../../Utils/upload/S3 Bucket/s3.config");
class UserReposetory extends DB_reposetory_1.DBReposetory {
    model;
    constructor(model = user_model_1.userModel) {
        super(model);
        this.model = model;
    }
    async createUser({ data, options }) {
        const [user] = await this.create({ data: [data], options }) || [];
        if (!user)
            throw new error_handler_1.AppError({ message: "Error creating user" });
        return user;
    }
    async deleteUser({ userId }) {
        const user = await this.findOne({ filter: { _id: userId } });
        if (!user)
            throw new error_handler_1.NotFoundError({ message: "User not found" });
        if (await Promise.all([
            this.model.deleteOne({ _id: userId }),
            post_model_1.postModel.deleteMany({ userId }),
            comment_model_1.commentModel.deleteMany({ userId }),
            user.assets?.length && (0, s3_config_1.deleteFiles)({ keys: user.assets })
        ]))
            return user;
        throw new error_handler_1.AppError({ message: "Error deleting user" });
    }
}
exports.UserReposetory = UserReposetory;
