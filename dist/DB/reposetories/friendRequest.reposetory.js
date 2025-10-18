"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRequestReposetory = void 0;
const DB_reposetory_1 = require("./DB.reposetory");
const friendRequest_model_1 = require("../Models/friendRequest.model");
class FriendRequestReposetory extends DB_reposetory_1.DBReposetory {
    model;
    constructor(model = friendRequest_model_1.friendRequestModel) {
        super(model);
        this.model = model;
    }
}
exports.FriendRequestReposetory = FriendRequestReposetory;
