import { CreateOptions, Model } from "mongoose";
import { HPostDocument, IPost, postModel } from "../Models/post.model";
import { DBReposetory } from "./DB.reposetory";
import { AppError } from "../../Utils/Handlers/error.handler";


export class PostReposetory extends DBReposetory<IPost> {
    constructor(protected override readonly model: Model<IPost> = postModel) {
        super(model);
    }
    public createPost({
        data,
        options
    }: {
        data: Partial<IPost>,
        options?: CreateOptions | undefined
    }): HPostDocument {
        const post = new this.model(data)
        if (!post) throw new AppError({message:"error creating post"})
        return post    
    }
}