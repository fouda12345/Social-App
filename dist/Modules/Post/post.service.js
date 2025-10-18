"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_reposetory_1 = require("../../DB/reposetories/post.reposetory");
const user_reposetory_1 = require("../../DB/reposetories/user.reposetory");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
const success_handler_1 = require("../../Utils/Handlers/success.handler");
const s3_config_1 = require("../../Utils/upload/S3 Bucket/s3.config");
const post_model_1 = require("../../DB/Models/post.model");
const user_model_1 = require("../../DB/Models/user.model");
const mongoose_1 = require("mongoose");
const post_validation_1 = require("./post.validation");
class PostService {
    _userModel = new user_reposetory_1.UserReposetory();
    _postModel = new post_reposetory_1.PostReposetory();
    constructor() { }
    createPost = async (req, res, next) => {
        const { tags } = req.body;
        if (tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: tags } } })).length !== tags.length)
            throw new error_handler_1.NotFoundError({ message: "One or more tags are invalid" });
        let uploadData = [];
        const post = this._postModel.createPost({ data: { ...req.body, userId: req.user?._id } });
        if (req.files?.length) {
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
        await this._userModel.updateOne({ filter: { _id: req.user?._id }, update: { $addToSet: { assets: { $each: post.attachments } } } });
        return (0, success_handler_1.successHandler)({ res, statusCode: 201, message: "Post created successfully", data: { post, attachments: process.env.UPLOAD_TYPE === "PRE_SIGNED" ? uploadData : undefined } });
    };
    sharePost = async (req, res, next) => {
        const { postId } = req.params;
        const originalPost = await this._postModel.findOne({
            filter: {
                _id: postId,
                $or: this.PrivacyAccessFilter(req.user)
            }
        });
        if (!originalPost)
            throw new error_handler_1.NotFoundError({ message: "post not found" });
        req.body.shared = true;
        req.body.originalPostId = originalPost._id;
        req.body.authorId = originalPost.userId;
        return next();
    };
    updatePost = async (req, res, next) => {
        const { postId } = req.params;
        let uploadData = [];
        if (req.files?.length) {
            uploadData = await (0, s3_config_1.uploadFile)({
                files: req.files,
                path: `users/${req.user?._id}/posts/${postId}`
            });
        }
        if (req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length)
            throw new error_handler_1.NotFoundError({ message: "One or more tags are invalid" });
        if (req.body.removeTags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.removeTags }, paranoid: false } })).length !== req.body.removeTags.length)
            throw new error_handler_1.NotFoundError({ message: "One or more tags are invalid" });
        const postUpdate = await this._postModel.updateOne({
            filter: { _id: postId, userId: req.user?._id },
            update: [
                {
                    $set: {
                        content: req.body.content || "$content",
                        privacy: req.body.privacy || "$privacy",
                        allowComments: req.body.allowComments != null ? req.body.allowComments : "$allowComments",
                    }
                },
                {
                    $set: {
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$attachments",
                                        req.body.removeAttachments || []
                                    ]
                                },
                                uploadData.map(({ key }) => key)
                            ]
                        }
                    }
                },
                {
                    $set: {
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$tags",
                                        (req.body.removeTags || []).map((id) => mongoose_1.Types.ObjectId.createFromHexString(id))
                                    ]
                                },
                                (req.body.tags || []).map((id) => mongoose_1.Types.ObjectId.createFromHexString(id))
                            ]
                        }
                    }
                },
            ],
        });
        if (!postUpdate.modifiedCount) {
            if (uploadData.length)
                await (0, s3_config_1.deleteFiles)({ keys: uploadData.map(({ key }) => key), Quiet: true });
            throw new error_handler_1.BadRequestError({ message: "Failed to update post" });
        }
        if (req.body.removeAttachments?.length) {
            await (0, s3_config_1.deleteFiles)({ keys: req.body.removeAttachments, Quiet: true });
        }
        const post = await this._postModel.findOne({ filter: { _id: postId } });
        await this._userModel.updateOne({ filter: { _id: req.user?._id }, update: { $addToSet: { assets: { $each: post?.attachments } }, $pull: { assets: { $in: req.body.removeAttachments } } } });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Post updated successfully", data: { post } });
    };
    likeAndUnlikePost = async (req, res, next) => {
        if (!req.user)
            throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to like this post" });
        const { postId } = req.params;
        const post = await this._postModel.findOne({ filter: { _id: postId, $or: this.PrivacyAccessFilter(req.user) } });
        if (!post)
            throw new error_handler_1.NotFoundError({ message: "Post not found" });
        post.likes = post.likes || [];
        const userLikedPost = post.likes.indexOf(req.user._id);
        if (userLikedPost !== -1) {
            post.likes.splice(userLikedPost, 1);
        }
        else {
            post.likes.push(req.user._id);
        }
        await post.save();
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Post likes updated successfully", data: { post } });
    };
    getPosts = async (req, res, next) => {
        if (!req.user)
            throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to view posts" });
        const { page, limit, sortBy } = req.query;
        let sort = "";
        switch (sortBy) {
            case post_validation_1.PostSortingEnum.NEWEST:
                sort = "-createdAt";
                break;
            case post_validation_1.PostSortingEnum.OLDEST:
                sort = "createdAt";
                break;
            case post_validation_1.PostSortingEnum.LATEST_ACTIVITY:
                sort = "-latestActivity";
                break;
            case post_validation_1.PostSortingEnum.POPULAR:
                sort = "-popularity";
                break;
            default:
                sort = "-latestActivity";
        }
        const posts = await this._postModel.paginate({
            filter: {
                $or: this.PrivacyAccessFilter(req.user)
            },
            sort,
            page,
            limit,
        });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Posts fetched successfully", data: { posts } });
    };
    getSinglePost = async (req, res, next) => {
        if (!req.user)
            throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to view this post" });
        const { postId } = req.params;
        const post = await this._postModel.findOne({ filter: { _id: postId, $or: this.PrivacyAccessFilter(req.user) } });
        if (!post)
            throw new error_handler_1.NotFoundError({ message: "Post not found" });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Post fetched successfully", data: { post } });
    };
    freezePost = async (req, res, next) => {
        if (!req.user)
            throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to freeze this post" });
        const { postId } = req.params;
        let post = await this._postModel.findOne({ filter: { _id: postId, freezedAt: { $exists: false } } });
        if (!post)
            throw new error_handler_1.NotFoundError({ message: "Post not found" });
        switch (true) {
            case req.user._id == post.userId:
                break;
            case req.user.role == user_model_1.RoleEnum.ADMIN:
                break;
            default:
                throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to freeze this post" });
        }
        post = await this._postModel.findOneAndUpdate({ filter: { _id: postId, freezedAt: { $exists: false } }, update: { freezedAt: new Date(), freezedBy: req.user._id }, options: { new: true } });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Post deleted successfully", data: { post } });
    };
    restorePost = async (req, res, next) => {
        if (!req.user)
            throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to restore this post" });
        const { postId } = req.params;
        let post = await this._postModel.findOne({ filter: { _id: postId, freezedAt: { $exists: true } } });
        if (!post)
            throw new error_handler_1.NotFoundError({ message: "Post not found" });
        switch (true) {
            case req.user._id == post.freezedBy && req.user._id == post.userId:
                break;
            case req.user.role == user_model_1.RoleEnum.ADMIN && post.userId != post.freezedBy:
                break;
            default:
                throw new error_handler_1.UnauthorizedError({ message: "You are not authorized to restore this post" });
        }
        post = await this._postModel.findOneAndUpdate({ filter: { _id: postId }, update: { $unset: { freezedAt: 1, freezedBy: 1 }, restoredAt: new Date(), restoredBy: req.user._id }, options: { new: true } });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Post restored successfully", data: { post } });
    };
    PrivacyAccessFilter(user) {
        return [
            { tags: { $in: [user._id] } },
            { privacy: post_model_1.PrivacyEnum.PUBLIC },
            { privacy: post_model_1.PrivacyEnum.FRIENDS, userId: { $in: user.friends || [] } },
            { privacy: post_model_1.PrivacyEnum.ONLY_ME, userId: user._id },
        ];
    }
}
exports.default = new PostService();
