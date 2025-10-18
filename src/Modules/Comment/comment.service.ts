import { NextFunction, Request, Response } from "express";
import { successHandler } from "../../Utils/Handlers/success.handler";
import { PostReposetory } from "../../DB/reposetories/post.reposetory";
import { CommentReposetory } from "../../DB/reposetories/comment.reposetory";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../Utils/Handlers/error.handler";
import { PrivacyEnum } from "../../DB/Models/post.model";
import { HUserDocument, RoleEnum } from "../../DB/Models/user.model";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import { deleteFiles, IPresignedUrlData, uploadFile } from "../../Utils/upload/S3 Bucket/s3.config";
import { Promise, Types } from "mongoose";



class CommentService {
    private _postModel = new PostReposetory();
    private _commentModel = new CommentReposetory();
    private _userModel = new UserReposetory();
    constructor() { }
    private PrivacyAccessFilter(user: HUserDocument) {
        return [
            { tags: { $in: [user._id] } },
            { privacy: PrivacyEnum.PUBLIC },
            { privacy: PrivacyEnum.FRIENDS, userId: { $in: user.friends || [] } },
            { privacy: PrivacyEnum.ONLY_ME, userId: user._id },
        ]
    }
    createComment = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) throw new NotFoundError({ message: "User not found" })

        const post = await this._postModel.findOne({
            filter: { _id: req.params.postId, $or: this.PrivacyAccessFilter(req.user), allowComments: true }
        });

        if (!post) throw new NotFoundError({ message: "Post not found" })

        if (req.params.commentId && ! await this._commentModel.findOne({ filter: { _id: req.params.commentId, postId: post._id } })) {
            throw new NotFoundError({ message: "Comment not found" })
        }

        if (
            req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length
        ) throw new NotFoundError({ message: "One or more tags are invalid" })

        let uploadData: { key: string, url: string }[] | { key: string }[] = []

        const comment = this._commentModel.createComment({
            data: { ...req.body, userId: req.user?._id, postId: post._id, commentId: req.params.commentId }
        })
        if (req.files?.length) {
            uploadData = await uploadFile({ files: req.files as Express.Multer.File[] | IPresignedUrlData[], path: `users/${post.userId}/posts/${post._id}/comments/${comment._id}` })
            comment.attachments = uploadData.map(({ key }) => key)
        }
        try {
            await comment.save()
        } catch (error) {
            if (uploadData.length)
                await deleteFiles({ keys: post.attachments as string[], Quiet: true });
            throw error;
        }
        const updatedPost = req.params.commentId
            ? await this._commentModel.updateOne({
                filter: { _id: req.params.commentId },
                update: { $push: { comments: comment._id } }
            })
            : await this._postModel.updateOne({
                filter: { _id: post._id },
                update: { $push: { comments: comment._id } }
            })

        if (!updatedPost.modifiedCount) {
            await this._commentModel.deleteOne({ filter: { _id: comment._id } })
            if (uploadData.length)
                await deleteFiles({ keys: post.attachments as string[], Quiet: true });
            throw new BadRequestError({ message: "error adding comment" })
        }
        await this._userModel.updateOne({ filter: { _id: comment.userId }, update: { $addToSet: { assets: { $each: uploadData.map(({ key }) => key) } } }})
        return successHandler({ res, statusCode: 201, message: "Comment created successfully", data: { comment: req.body.commentId ? undefined : comment, reply: req.body.commentId ? comment : undefined, attachments: process.env.UPLOAD_TYPE === "PRE_SIGNED" ? uploadData : undefined } });
    }

    updateComment = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { postId, commentId } = req.params
        let uploadData: { key: string, url: string }[] | { key: string }[] = []
        if (req.files?.length) {
            uploadData = await uploadFile({
                files: req.files as Express.Multer.File[] | IPresignedUrlData[],
                path: `users/${req.user?._id}/posts/${postId}/comments/${commentId}`
            })
        }
        if (
            req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } })).length !== req.body.tags.length
        ) throw new NotFoundError({ message: "One or more tags are invalid" });
        if (
            req.body.removeTags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.removeTags }, paranoid: false } })).length !== req.body.removeTags.length
        ) throw new NotFoundError({ message: "One or more tags are invalid" });

        const [post, comment] = await Promise.all([
            this._commentModel.findOne({ filter: { _id: commentId, postId, userId: req.user?._id } }),
            this._postModel.findOne({ filter: { _id: postId } })
        ])

        if (!post || !comment || (comment.commentId && !await this._commentModel.findOne({ filter: { _id: comment.commentId, postId } }))) throw new NotFoundError({ message: "Comment not found" })

        const commentUpdate = await this._commentModel.updateOne({
            filter: { _id: commentId, userId: req.user?._id, postId },
            update: [
                {
                    $set: {
                        content: req.body.content || "$content",
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
                                        (req.body.removeTags || []).map((id: string) => Types.ObjectId.createFromHexString(id))
                                    ]
                                },
                                (req.body.tags || []).map((id: string) => Types.ObjectId.createFromHexString(id))
                            ]
                        }
                    }
                },
            ],
        })

        if (!commentUpdate.modifiedCount) {
            if (uploadData.length)
                await deleteFiles({ keys: uploadData.map(({ key }) => key), Quiet: true });
            throw new BadRequestError({ message: "Failed to update post" })
        }

        if (req.body.removeAttachments?.length) {
            await deleteFiles({ keys: req.body.removeAttachments, Quiet: true });
        }

        const updatedComment = await this._commentModel.findOne({ filter: { _id: commentId } })
        if (!updatedComment) {
            if (uploadData.length)
                await deleteFiles({ keys: uploadData.map(({ key }) => key), Quiet: true });
            throw new BadRequestError({ message: "Failed to update post" })
        }
        await this._userModel.updateOne({ filter: { _id: updatedComment.userId }, update: { $addToSet: { assets: { $each: updatedComment.attachments } } , $pull: { assets: { $in: req.body.removeAttachments } } } })
        return successHandler({ res, statusCode: 200, message: "Post updated successfully", data: { post } });
    }

    freezeComment = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to delete this post" })
        const { postId , commentId } = req.params
        let comment = await this._commentModel.findOne({ filter: { _id: commentId, postId, freezedAt: { $exists: false } } })
        if (!comment) throw new NotFoundError({ message: "comment not found" })
        switch (true) {
            case req.user._id == comment.userId:
                break;
            case req.user.role == RoleEnum.ADMIN:
                break;
            default:
                throw new UnauthorizedError({ message: "You are not authorized to delete this comment" })
        }
        comment = await this._commentModel.findOneAndUpdate({ filter: { _id: commentId, freezedAt: { $exists: false } }, update: { freezedAt: new Date(), freezedBy: req.user._id }, options: { new: true } })
        return successHandler({ res, statusCode: 200, message: "Post deleted successfully", data: { comment } });
    }

    restoreComment = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to restore this post" })
        const { postId,commentId } = req.params
        let comment = await this._postModel.findOne({ filter: { _id: commentId, postId, freezedAt: { $exists: true } } })
        if (!comment) throw new NotFoundError({ message: "comment not found" })
        switch (true) {
            case req.user._id == comment.freezedBy && req.user._id == comment.userId:
                break;
            case req.user.role == RoleEnum.ADMIN && comment.userId != comment.freezedBy:
                break;
            default:
                throw new UnauthorizedError({ message: "You are not authorized to restore this post" })
        }
        comment = await this._postModel.findOneAndUpdate({ filter: { _id: commentId }, update: { $unset: { freezedAt: 1, freezedBy: 1 }, restoredAt: new Date(), restoredBy: req.user._id }, options: { new: true } })
        return successHandler({ res, statusCode: 200, message: "Post restored successfully", data: { comment } });
    }
}

export default new CommentService();