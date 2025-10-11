import { HydratedDocument, model , models, Schema, Types } from "mongoose";
import { string } from "zod";


export interface IComment {
    _id: Types.ObjectId;
    
    userId: Types.ObjectId;
    postId: Types.ObjectId;
    commentId?: Types.ObjectId;

    content?: string;
    attachments?: string[];

    tags?: Types.ObjectId[];
    likes?: Types.ObjectId[];
    replies?: Types.ObjectId[];
    
    freezedBy?: Types.ObjectId;
    freezedAt?: Date;

    restoredBy?: Types.ObjectId;
    restoredAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}

export const commentSchema = new Schema<IComment>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
    },
    content: {
        type: String,
        minLength: 2,
        maxLength: 200,
        required : function() {
            return !this.attachments?.length;
        },
    },
    attachments: [string],
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    replies: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],
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

commentSchema.virtual("popularity").get(function(this: IComment) {
    return (this.likes?.length || 0) + (this.replies?.length || 0);
})

commentSchema.pre(["find" , "findOne" , "findOneAndUpdate" , "updateOne" , "updateMany" , "countDocuments"], function (next) {
    const query = this.getQuery();
    if (query.paranoid !== false) {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
})


export const commentModel = models.Comment || model<IComment>('Comment', commentSchema);
export type HCommentDocument = HydratedDocument<IComment>;