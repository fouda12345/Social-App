"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_reposetory_1 = require("../../DB/reposetories/post.reposetory");
const user_reposetory_1 = require("../../DB/reposetories/user.reposetory");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
const success_handler_1 = require("../../Utils/Handlers/success.handler");
const s3_config_1 = require("../../Utils/upload/S3 Bucket/s3.config");
class PostService {
    _userModel = new user_reposetory_1.UserReposetory();
    _postModel = new post_reposetory_1.PostReposetory();
    constructor() { }
    createPost = async (req, res, next) => {
        const { tags } = req.body;
        if (tags &&
            tags.length > 0 &&
            (await this._userModel.find({ filter: { _id: { $in: tags } } })).length !== tags.length)
            throw new error_handler_1.NotFoundError({ message: "One or more tags are invalid" });
        let uploadData = [];
        const post = this._postModel.createPost({ data: { ...req.body, userId: req.user?._id } });
        if (req.files && req.files.length) {
            uploadData = await (0, s3_config_1.uploadFile)({ files: req.files, path: `users/${req.user?._id}/posts/${post._id}` });
            post.attachments = uploadData.map(({ key }) => key);
        }
        try {
            await post.save();
        }
        catch (error) {
            if (uploadData.length)
                await (0, s3_config_1.deleteFiles)({ keys: post.attachments, Quiet: true });
            throw error;
        }
        return (0, success_handler_1.successHandler)({ res, statusCode: 201, message: "Post created successfully", data: { post, attachments: process.env.UPLOAD_TYPE === "PRE_SIGNED" ? uploadData : undefined } });
    };
    updatePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findOneAndUpdate({ filter: { _id: postId, userId: req.user?._id }, update: { ...req.body }, options: { new: true } });
        if (!post)
            throw new error_handler_1.NotFoundError({ message: "Post not found" });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Post updated successfully", data: { post } });
    };
}
exports.default = new PostService();
