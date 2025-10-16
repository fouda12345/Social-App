import { Model } from "mongoose";
import { DBReposetory } from "./DB.reposetory";
import { friendRequestModel, IFriendRequest } from "../Models/friendRequest.model";


export class FriendRequestReposetory extends DBReposetory<IFriendRequest> {
    constructor(protected override readonly model: Model<IFriendRequest> = friendRequestModel) {
        super(model);
    }
}