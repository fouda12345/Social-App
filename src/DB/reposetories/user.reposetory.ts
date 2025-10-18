import { CreateOptions, Model } from "mongoose";
import { IUser, HUserDocument, userModel } from "../Models/user.model";
import { DBReposetory } from "./DB.reposetory";
import { AppError, NotFoundError } from "../../Utils/Handlers/error.handler";
import { postModel } from "../Models/post.model";
import { commentModel } from "../Models/comment.model";
import { deleteFiles } from "../../Utils/upload/S3 Bucket/s3.config";


export class UserReposetory extends DBReposetory<IUser> {
    constructor(protected override readonly model:Model<IUser> = userModel) {
        super(model);
    }

    public async createUser({
        data,
        options
    } : {
        data: Partial<IUser>,
        options?: CreateOptions | undefined
    }) : Promise<HUserDocument> {
        const [user] = await this.create({ data:[data],options}) || [];
        if (!user) throw new AppError({message:"Error creating user"}); 
        return user
    }

    public async deleteUser({
        userId
    } : {
        userId: string
    }) : Promise<HUserDocument> {
        const user = await this.findOne({ filter: { _id: userId } }) as HUserDocument;
        if (!user) throw new NotFoundError({message:"User not found"});
        if (await Promise.all([
            this.model.deleteOne({ _id: userId }),
            postModel.deleteMany({ userId }),
            commentModel.deleteMany({ userId }),
            user.assets?.length && deleteFiles({keys:user.assets})
        ])) return user
        throw new AppError({message:"Error deleting user"})
    }
}