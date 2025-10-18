import { HydratedDocument, model , models, Schema, Types } from "mongoose";

export interface IFriendRequest {
    _id: Types.ObjectId;
    createdBy: Types.ObjectId;
    sendTo: Types.ObjectId;
    acceptedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export const userSchema = new Schema<IFriendRequest>({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sendTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    acceptedAt: {
        type: Date
    }
},
{
    timestamps: true,
});

export const friendRequestModel = models.FriendRequest || model<IFriendRequest>('FriendRequest', userSchema);
export type HFriednRequestDocument = HydratedDocument<IFriendRequest>;