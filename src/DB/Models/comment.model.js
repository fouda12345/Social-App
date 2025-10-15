"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentModel = exports.commentSchema = void 0;
const mongoose_1 = require("mongoose");
exports.commentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
    },
    commentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Comment',
    },
    content: {
        type: String,
        minLength: 2,
        maxLength: 200,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    tags: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    likes: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    replies: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Comment'
        }],
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
exports.commentSchema.virtual("popularity").get(function () {
    return (this.likes?.length || 0) + (this.replies?.length || 0);
});
exports.commentSchema.pre(["find", "findOne", "findOneAndUpdate", "updateOne", "updateMany", "countDocuments"], function (next) {
    const query = this.getQuery();
    if (query.paranoid !== false) {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.commentModel = mongoose_1.models.Comment || (0, mongoose_1.model)('Comment', exports.commentSchema);
