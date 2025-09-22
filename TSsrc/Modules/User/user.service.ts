import { NextFunction, Request, Response } from "express";
import { successHandler } from "../../Utils/Handlers/success.handler";
import { IlogoutDTO } from "./user.dto";
import { logoutFlag } from "./user.validation";
import { TokenReposetory } from "../../DB/reposetories/token.reposetory";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import { createCredentials, Credentials } from "../../Utils/Security/jwt.utils";
import { HUserDocument } from "../../DB/Models/user.model";
import { JwtPayload } from "jsonwebtoken";

class UserService {
    private _userModel = new UserReposetory();
    private _tokenModel = new TokenReposetory();
    constructor() { }
    public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        return successHandler({ res, statusCode: 200, message: "Success", data: {user: req.user, decodedToken: req.decodedToken} });
    }
    public logout = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const {flag} : IlogoutDTO = req.body;
        let statusCode = 200;
        switch (flag) {
            case logoutFlag.ALL:
                await this._userModel.findOneAndUpdate({
                    filter: { _id: req.decodedToken?._id },
                    update: { credentailsUpdatedAt: new Date() }
                })
                break;
            case logoutFlag.ONLY:
                await this._tokenModel.revokeToken(req.decodedToken as JwtPayload);
                statusCode = 201
                break;
        }
        return successHandler({ res, statusCode, message: "logged out successfully" });
    }
    public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const credentials:Credentials = await createCredentials(req.user as HUserDocument);
        await this._tokenModel.revokeToken(req.decodedToken as JwtPayload);
        return successHandler({ res, statusCode: 201, message: "Success", data: credentials });
    }
}

export default new UserService();