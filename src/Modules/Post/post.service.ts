import { NextFunction, Request, Response } from "express";
import { PostReposetory } from "../../DB/reposetories/post.reposetory";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import { IGetPostsDTO, ICreatePostDTO } from "./post.dto";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../Utils/Handlers/error.handler";
import { successHandler } from "../../Utils/Handlers/success.handler";
import { deleteFiles, IPresignedUrlData, uploadFile } from "../../Utils/upload/S3 Bucket/s3.config";
import { HPostDocument, PrivacyEnum } from "../../DB/Models/post.model";
import { HUserDocument, RoleEnum } from "../../DB/Models/user.model";
import { Types } from "mongoose";
import { PostSortingEnum } from "./post.validation";




class PostService {
    private _userModel = new UserReposetory();
    private _postModel = new PostReposetory();
    constructor() { }

    createPost = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { tags }: ICreatePostDTO = req.body
        if (
            tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: tags } } })).length !== tags.length
        ) throw new NotFoundError({ message: "One or more tags are invalid" });
        let uploadData: { key: string, url: string }[] | { key: string }[] = []
        const post = this._postModel.createPost({ data: { ...req.body, userId: req.user?._id } });
        if (req.files?.length) {
            uploadData = await uploadFile({ files: req.files as Express.Multer.File[], path: `users/${req.user?._id}/posts/${post._id}` })
            post.attachments = uploadData.map(({ key }) => key)
        }
        try {
            await post.save()
        } catch (error) {
            if (uploadData.length)
                await deleteFiles({ keys: post.attachments as string[], Quiet: true });
            throw error;
        }
        await this._userModel.updateOne({ filter: { _id: req.user?._id }, update: { $addToSet: { assets: { $each: post.attachments } } }})
        return successHandler({ res, statusCode: 201, message: "Post created successfully", data: { post, attachments: process.env.UPLOAD_TYPE === "PRE_SIGNED" ? uploadData : undefined } });
    }

    sharePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { postId } = req.params
        const originalPost = await this._postModel.findOne({ 
            filter: { 
                _id: postId,
                $or:this.PrivacyAccessFilter(req.user as HUserDocument)
            } 
        }) as HPostDocument
        if (!originalPost) throw new NotFoundError({ message: "post not found" })
        req.body.shared = true
        req.body.originalPostId = originalPost._id
        req.body.authorId = originalPost.userId
        return next();
    }

    updatePost = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { postId } = req.params
        let uploadData: { key: string, url: string }[] | { key: string }[] = []
        if (req.files?.length) {
            uploadData = await uploadFile({
                files: req.files as Express.Multer.File[] | IPresignedUrlData[],
                path: `users/${req.user?._id}/posts/${postId}`
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
        if (!postUpdate.modifiedCount) {
            if (uploadData.length)
                await deleteFiles({ keys: uploadData.map(({ key }) => key), Quiet: true });
            throw new BadRequestError({ message: "Failed to update post" })
        }
        if (req.body.removeAttachments?.length) {
            await deleteFiles({ keys: req.body.removeAttachments, Quiet: true });
        }
        const post = await this._postModel.findOne({ filter: { _id: postId } })
        await this._userModel.updateOne({ filter: { _id: req.user?._id }, update: { $addToSet: { assets: { $each: post?.attachments } } , $pull: { assets: { $in: req.body.removeAttachments } } } })
        return successHandler({ res, statusCode: 200, message: "Post updated successfully", data: { post } });
    }

    likeAndUnlikePost = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to like this post" })
        const { postId } = req.params
        const post = await this._postModel.findOne({ filter: { _id: postId , $or: this.PrivacyAccessFilter(req.user as HUserDocument) } }) as HPostDocument
        if (!post) throw new NotFoundError({ message: "Post not found" })
        post.likes = post.likes || []
        const userLikedPost = post.likes.indexOf(req.user._id)
        if (userLikedPost !== -1) {
            post.likes.splice(userLikedPost, 1)
        } else {
            post.likes.push(req.user._id)
        }
        await post.save()
        return successHandler({ res, statusCode: 200, message: "Post likes updated successfully", data: { post } });
    }

    getPosts = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to view posts" })
        const { page, limit, sortBy } = req.query as unknown as IGetPostsDTO
        let sort = ""
        switch (sortBy) {
            case PostSortingEnum.NEWEST:
                sort = "-createdAt"
                break;
            case PostSortingEnum.OLDEST:
                sort = "createdAt"
                break;
            case PostSortingEnum.LATEST_ACTIVITY:
                sort = "-latestActivity"
                break;
            case PostSortingEnum.POPULAR:
                sort = "-popularity"
                break;
            default:
                sort = "-latestActivity"
        }
        
        const posts = await this._postModel.paginate({
            filter: {
                $or: this.PrivacyAccessFilter(req.user)
            },
            sort,
            page,
            limit,
        })
        return successHandler({ res, statusCode: 200, message: "Posts fetched successfully", data: { posts } });
    }

    getSinglePost = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to view this post" })
        const { postId } = req.params
        const post = await this._postModel.findOne({ filter: { _id: postId , $or: this.PrivacyAccessFilter(req.user) } })
        if (!post) throw new NotFoundError({ message: "Post not found" })
        return successHandler({ res, statusCode: 200, message: "Post fetched successfully", data: { post } });
    }

    freezePost = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to freeze this post" })
        const { postId } = req.params
        let post = await this._postModel.findOne({ filter: { _id: postId  , freezedAt:{ $exists: false}} })
        if (!post) throw new NotFoundError({ message: "Post not found" })
        switch (true) {
            case req.user._id == post.userId:
                break;
            case req.user.role == RoleEnum.ADMIN:
                break;
            default:
                throw new UnauthorizedError({ message: "You are not authorized to freeze this post" })
        }
        post = await this._postModel.findOneAndUpdate({ filter: { _id: postId ,freezedAt:{ $exists: false}}, update : {freezedAt: new Date() , freezedBy: req.user._id} , options:{new: true}})
        return successHandler({ res, statusCode: 200, message: "Post deleted successfully", data: { post } });
    }

    restorePost = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        if (!req.user) throw new UnauthorizedError({ message: "You are not authorized to restore this post" })
        const { postId } = req.params
        let post = await this._postModel.findOne({ filter: { _id: postId , freezedAt:{ $exists: true}} })
        if (!post) throw new NotFoundError({ message: "Post not found" })
        switch (true) {
            case req.user._id == post.freezedBy && req.user._id == post.userId:
                break;
            case req.user.role == RoleEnum.ADMIN && post.userId != post.freezedBy:
                break;
            default:
                throw new UnauthorizedError({ message: "You are not authorized to restore this post" })
        }
        post = await this._postModel.findOneAndUpdate({ filter: { _id: postId }, update : {$unset: {freezedAt: 1 , freezedBy: 1} , restoredAt: new Date() , restoredBy: req.user._id} , options:{new: true}})
        return successHandler({ res, statusCode: 200, message: "Post restored successfully", data: { post } });
    }

    private PrivacyAccessFilter(user: HUserDocument) {
        return [
            { tags: { $in: [user._id] } },
            { privacy: PrivacyEnum.PUBLIC },
            { privacy: PrivacyEnum.FRIENDS, userId: { $in: user.friends || [] } },
            { privacy: PrivacyEnum.ONLY_ME, userId: user._id },
        ]
    }
}

export default new PostService();