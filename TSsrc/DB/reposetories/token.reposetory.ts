import { DBReposetory } from "./DB.reposetory";
import { HTokenDocument, IToken, tokenModel } from "../Models/token.model";
import { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../Utils/Handlers/error.handler";


export class TokenReposetory extends DBReposetory<IToken> {
    constructor() {
        super(tokenModel);
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