"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostReposetory = void 0;
const post_model_1 = require("../Models/post.model");
const DB_reposetory_1 = require("./DB.reposetory");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
class PostReposetory extends DB_reposetory_1.DBReposetory {
    model;
    constructor(model = post_model_1.postModel) {
        super(model);
        this.model = model;
    }
    createPost({ data, options }) {
        const post = new this.model(data);
        if (!post)
            throw new error_handler_1.AppError({ message: "error creating post" });
        return post;
    }
}
exports.PostReposetory = PostReposetory;
