"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserReposetory = void 0;
const user_model_1 = require("../Models/user.model");
const DB_reposetory_1 = require("./DB.reposetory");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
class UserReposetory extends DB_reposetory_1.DBReposetory {
    model;
    constructor(model = user_model_1.userModel) {
        super(model);
        this.model = model;
    }
    async createUser({ data, options }) {
        let users = [data];
        const [user] = await this.create({ data: users, options }) || [];
        if (!user)
            throw new error_handler_1.AppError({ message: "Error creating user" });
        return user;
    }
}
exports.UserReposetory = UserReposetory;
