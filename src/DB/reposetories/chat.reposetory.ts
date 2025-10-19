import { DBReposetory } from "./DB.reposetory";
import { chatModel, IChat } from "../Models/chat.model";
import { Model } from "mongoose";


export class ChatReposetory extends DBReposetory<IChat> {
    constructor(protected override readonly model: Model<IChat> = chatModel) {
        super(model);
    }
}