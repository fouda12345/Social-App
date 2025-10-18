"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendRequestModel = exports.userSchema = void 0;
const mongoose_1 = require("mongoose");
exports.userSchema = new mongoose_1.Schema({
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sendTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    acceptedAt: {
        type: Date
    }
}, {
    timestamps: true,
});
exports.friendRequestModel = mongoose_1.models.FriendRequest || (0, mongoose_1.model)('FriendRequest', exports.userSchema);
