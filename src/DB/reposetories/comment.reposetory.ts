import { CreateOptions, Model } from "mongoose";
import { DBReposetory } from "./DB.reposetory";
import { AppError } from "../../Utils/Handlers/error.handler";
import { commentModel, HCommentDocument, IComment } from "../Models/comment.model";


export class CommentReposetory extends DBReposetory<IComment> {
    constructor(protected override readonly model: Model<IComment> = commentModel) {
        super(model);
    }
    public createComment({
        data,
        options
    }: {
        data: Partial<IComment>,
        options?: CreateOptions | undefined
    }): HCommentDocument {
        const comment = new this.model(data)
        if (!comment) throw new AppError({message:"error creating post"})
        return comment    
    }
}