import { NextFunction, Request, RequestHandler, Response } from "express";
import { BadRequestError, ForbiddenError } from "../Utils/Handlers/error.handler";
import { decodeToken, TokenType } from "../Utils/Security/jwt.utils";
import { HUserDocument, RoleEnum } from "../DB/Models/user.model";
import { JwtPayload } from "jsonwebtoken";

export const auth = ({
    required  = true,
    tokenType = TokenType.ACCESS,
    accessRoles = []
} : {
    required ?: boolean;
    tokenType ?: TokenType;
    accessRoles ?: RoleEnum[]
} = {}) : RequestHandler => {
    return async (req:Request, res:Response, next:NextFunction) : Promise<void> => {
        if(!req.headers.authorization && required)
            throw new BadRequestError({message:"Authorization header is required"});
        if(!req.headers.authorization && !required) 
            return next();
        const {user , decodedToken} : {user : HUserDocument , decodedToken : JwtPayload} = await decodeToken({authorization : req.headers.authorization as string , tokenType});
        if(accessRoles?.length > 0 && !accessRoles.includes(user.role as RoleEnum))
            throw new ForbiddenError({message:"You are not authorized to access this route"});
        req.user = user;
        req.decodedToken = decodedToken;
        next();          
    }
}