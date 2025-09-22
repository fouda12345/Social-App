import { NextFunction, Request, RequestHandler, Response } from "express";
import { BadRequestError } from "../Utils/Handlers/error.handler";
import { decodeToken, TokenType } from "../Utils/Security/jwt.utils";
import { HUserDocument } from "../DB/Models/user.model";
import { JwtPayload } from "jsonwebtoken";

interface IAuthRequest extends Request {
    user ?: HUserDocument;
    decodedToken ?: JwtPayload;
}   

export const auth = ({
    required  = true,
    tokenType = TokenType.ACCESS
} : {
    required ?: boolean;
    tokenType ?: TokenType
}) : RequestHandler => {
    return async (req:IAuthRequest, res:Response, next:NextFunction) : Promise<void> => {
        if(!req.headers.authorization && required)
            throw new BadRequestError({message:"Authorization header is required"});
        const {user , decodedToken} = await decodeToken({authorization : req.headers.authorization as string , tokenType});
        req.user = user;
        req.decodedToken = decodedToken;
        next();          
    }
}