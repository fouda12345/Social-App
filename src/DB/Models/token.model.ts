import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IToken {
    jti: string;
    expiresIn: number;
    userId: Types.ObjectId;
}

export const tokenShema = new Schema<IToken>(
    {
        jti: {
            type: String,
            required: true
        },
        expiresIn: {
            type: Number,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true, }
);

export const tokenModel = models.Token || model<IToken>('Token', tokenShema);
export type HTokenDocument = HydratedDocument<IToken>;