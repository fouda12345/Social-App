import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IMessage {
    content: string;
    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export const messageSchema = new Schema<IMessage>({
    content: {
        type: String,
        required: true,
        minLength:1,
        maxLength:500
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},
{
    timestamps: true,
})

export interface IChat {
    _id: Types.ObjectId;
    participants: Types.ObjectId[];
    messages?: IMessage[];
    group?: string
    groupImage?: string
    roomId?: string
    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export const chatSchema = new Schema<IChat>({
    participants: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
        required: true
    },
    messages: {
        type: [messageSchema],
    },
    group: {
        type: String,
    },
    groupImage: {
        type: String,
    },
    roomId: {
        type: String,
        required: function() {
            return this.group
        }
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},
{
    timestamps: true,
});

export const chatModel = models.chat || model<IChat>('Chat', chatSchema);
export type HChatDocument = HydratedDocument<IChat>;