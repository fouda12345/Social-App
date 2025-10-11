import { CreateOptions, Model } from "mongoose";
import { IUser, HUserDocument, userModel } from "../Models/user.model";
import { DBReposetory } from "./DB.reposetory";
import { AppError } from "../../Utils/Handlers/error.handler";


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
}