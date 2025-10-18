"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postModel = exports.postSchema = exports.PrivacyEnum = void 0;
const mongoose_1 = require("mongoose");
var PrivacyEnum;
(function (PrivacyEnum) {
    PrivacyEnum["PUBLIC"] = "PUBLIC";
    PrivacyEnum["FRIENDS"] = "FRIENDS";
    PrivacyEnum["ONLY_ME"] = "ONLY_ME";
})(PrivacyEnum || (exports.PrivacyEnum = PrivacyEnum = {}));
exports.postSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shared: {
        type: Boolean,
        default: false
    },
    originalPostId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
        required: function () {
            return this.shared;
        }
    },
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: function () {
            return this.shared;
        }
    },
    content: {
        type: String,
        minLength: 2,
        maxLength: 5000,
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
    comments: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Comment'
        }],
    shares: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    privacy: {
        type: String,
        enum: Object.values(PrivacyEnum),
        default: PrivacyEnum.PUBLIC
    },
    allowComments: {
        type: Boolean,
        default: true
    },
    freezedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    freezedAt: Date,
    restoredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    restoredAt: Date,
    latestActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
exports.postSchema.virtual("popularity").get(function () {
    return (this.likes?.length || 0) + (this.comments?.length || 0) + (this.shares?.length || 0);
});
exports.postSchema.pre(["find", "findOne", "findOneAndUpdate", "updateOne", "updateMany", "countDocuments"], function (next) {
    const query = this.getQuery();
    if (query.paranoid !== false) {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.postSchema.pre("save", function (next) {
    if (this.isModified('likes') || this.isModified('comments') || this.isModified('shares')) {
        this.latestActivity = new Date();
    }
    next();
});
exports.postModel = mongoose_1.models.Post || (0, mongoose_1.model)('Post', exports.postSchema);
