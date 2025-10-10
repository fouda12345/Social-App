import { HydratedDocument, model , models, Schema, Types } from "mongoose";

export enum PrivacyEnum {
    PUBLIC = "PUBLIC",
    FRIENDS = "FRIENDS",
    ONLY_ME = "ONLY_ME"
}

export interface IPost {
    _id: Types.ObjectId;
    
    userId: Types.ObjectId;

    shared?: boolean;
    originalPostId?: Types.ObjectId;
    authorId?: Types.ObjectId;

    content?: string;
    attachments?: string[];

    tags?: Types.ObjectId[];
    likes?: Types.ObjectId[];
    comments?: Types.ObjectId[];
    shares?: Types.ObjectId[];

    privacy: PrivacyEnum;
    allowComments: boolean;

    freezedBy?: Types.ObjectId;
    freezedAt?: Date;

    restoredBy?: Types.ObjectId;
    restoredAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}

export const postShema = new Schema<IPost>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shared: {
        type: Boolean,
        default: false
    },
    originalPostId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: function(this: IPost) {
            return this.shared;
        }
    },
    authorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function(this: IPost) {
            return this.shared;
        }
    },
    content: {
        type: String,
        minLength: 2,
        maxLength: 5000,
        required: function(this: IPost) {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    shares: [{
        type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    freezedAt: Date,
    restoredBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    restoredAt: Date
}, 
{
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});



export const postModel = models.Post || model<IPost>('Post', postShema);
export type HPostDocument = HydratedDocument<IPost>;