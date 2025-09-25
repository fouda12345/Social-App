import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IAsset {
    key: string,
    userId: Types.ObjectId
}

export const assetShema = new Schema<IAsset>(
    {
        key: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true}
);

export const assetModel = models.Asset || model<IAsset>('Asset', assetShema);
export type HTokenDocument = HydratedDocument<IAsset>;