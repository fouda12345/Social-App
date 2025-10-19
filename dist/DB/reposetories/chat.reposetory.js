"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatReposetory = void 0;
const DB_reposetory_1 = require("./DB.reposetory");
const chat_model_1 = require("../Models/chat.model");
class ChatReposetory extends DB_reposetory_1.DBReposetory {
    model;
    constructor(model = chat_model_1.chatModel) {
        super(model);
        this.model = model;
    }
}
exports.ChatReposetory = ChatReposetory;
