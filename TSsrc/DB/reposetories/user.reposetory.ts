import { CreateOptions, HydratedDocument } from "mongoose";
import { IUser, userModel } from "../Models/user.model";
import { DBReposetory } from "./DB.reposetory";
import { AppError } from "../../Utils/Handlers/error.handler";


export class UserReposetory extends DBReposetory<IUser> {
    constructor() {
        super(userModel);
    }

    public async createUser({
        data,
        options
    } : {
        data: Partial<IUser>,
        options?: CreateOptions | undefined
    }) : Promise<HydratedDocument<IUser>> {
        let users: Partial<IUser>[] = [data];
        const [user] : HydratedDocument<IUser>[] | undefined | [] = await this.create({ data:users,options}) || [];
        if (!user) throw new AppError({message:"Error creating user"}); 
        return user
    }
}