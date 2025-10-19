"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatModel = exports.chatSchema = exports.messageSchema = void 0;
const mongoose_1 = require("mongoose");
exports.messageSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 500
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
});
exports.chatSchema = new mongoose_1.Schema({
    participants: {
        type: [{
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }],
        required: true
    },
    messages: {
        type: [exports.messageSchema],
    },
    group: {
        type: String,
    },
    groupImage: {
        type: String,
    },
    roomId: {
        type: String,
        required: function () {
            return this.group;
        }
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
});
exports.chatModel = mongoose_1.models.chat || (0, mongoose_1.model)('Chat', exports.chatSchema);
