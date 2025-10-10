import { NextFunction, Request, Response } from "express";
import { PostReposetory } from "../../DB/reposetories/post.reposetory";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import { IcreatePostDTO } from "./post.dto";
import {NotFoundError } from "../../Utils/Handlers/error.handler";
import { successHandler } from "../../Utils/Handlers/success.handler";
import { deleteFiles, IPresignedUrlData, uploadFile } from "../../Utils/upload/S3 Bucket/s3.config";



class PostService {
    private _userModel = new UserReposetory();
    private _postModel = new PostReposetory();
    constructor() { }
    
    createPost = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {tags} : IcreatePostDTO = req.body
        if (
            tags && 
            tags.length > 0 && 
            (await this._userModel.find({filter:{_id:{$in:tags}}})).length !== tags.length
        )   throw new NotFoundError({message:"One or more tags are invalid"});
        let uploadData : {key:string , url:string}[] | {key:string}[] = []
        const post = this._postModel.createPost({ data: { ...req.body , userId: req.user?._id} });
        if (req.files && (req.files as Express.Multer.File[] | IPresignedUrlData[]).length){
            uploadData = await uploadFile({files:req.files as Express.Multer.File[] , path:`users/${req.user?._id}/posts/${post._id}`})
            post.attachments = uploadData.map(({key}) => key)
        }
        try {
            await post.save()
        }catch (error) {
            if (uploadData.length)
                await deleteFiles({ keys: post.attachments as string[], Quiet: true });
            throw error;
        }
        return successHandler({ res, statusCode: 201, message: "Post created successfully", data: { post , attachments: process.env.UPLOAD_TYPE === "PRE_SIGNED" ? uploadData : undefined } }); 
    }

    updatePost = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { postId } = req.params
        const post = await this._postModel.findOneAndUpdate({ filter: { _id: postId, userId: req.user?._id }, update: { ...req.body } , options:{new:true} })
        if (!post) throw new NotFoundError({ message: "Post not found" })
        return successHandler({ res, statusCode: 200, message: "Post updated successfully", data: {post} });
    }
}

export default new PostService();