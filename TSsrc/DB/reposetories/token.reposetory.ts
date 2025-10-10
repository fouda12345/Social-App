import { DBReposetory } from "./DB.reposetory";
import { HTokenDocument, IToken, tokenModel } from "../Models/token.model";
import { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../Utils/Handlers/error.handler";
import { Model } from "mongoose";


export class TokenReposetory extends DBReposetory<IToken> {
    constructor(protected override readonly model:Model<IToken> = tokenModel) {
        super(model);
    }
    public revokeToken = async (decodedToken: JwtPayload): Promise<HTokenDocument> => {
        const [token] : HTokenDocument[] = await this.create({
            data: [
                {
                    jti: decodedToken.jti as string,
                    expiresIn: decodedToken.exp as number,
                    userId: decodedToken._id
                }
            ],
            options: { validateBeforeSave: true }
        }) || []
        if (!token) {
            throw new AppError({ message: "Error revoking token" });
        }
        return token
    }
}