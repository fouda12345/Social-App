"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentReposetory = void 0;
const DB_reposetory_1 = require("./DB.reposetory");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
const comment_model_1 = require("../Models/comment.model");
class CommentReposetory extends DB_reposetory_1.DBReposetory {
    model;
    constructor(model = comment_model_1.commentModel) {
        super(model);
        this.model = model;
    }
    createComment({ data, options }) {
        const comment = new this.model(data);
        if (!comment)
            throw new error_handler_1.AppError({ message: "error creating post" });
        return comment;
    }
}
exports.CommentReposetory = CommentReposetory;
