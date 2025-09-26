import jwt, { JwtPayload, PrivateKey, Secret, SignOptions } from "jsonwebtoken";
import { RoleEnum, HUserDocument } from "../../DB/Models/user.model";
import type { StringValue } from "ms";
import { NotFoundError, UnauthorizedError } from "../Handlers/error.handler";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import {v4 as uuid} from "uuid";
import { TokenReposetory } from "../../DB/reposetories/token.reposetory";

export enum TokenType {
    ACCESS = "ACCESS",
    REFRESH = "REFRESH"
}
export enum SignatureLevel {
   USER = "ATCH",
   ADMIN = "HUGK"
}
export type Signatures = {
    accessSecret: Secret,
    refreshSecret: Secret,
}
export type Credentials = {
    accessToken?: string,
    refreshToken?: string
}
export const getSignatureLevel = async (role: RoleEnum) : Promise<SignatureLevel> => {
    let signatureLevel: SignatureLevel
    switch (role) {
        case RoleEnum.ADMIN:
            signatureLevel = SignatureLevel.ADMIN
            break;
        case RoleEnum.USER:
            signatureLevel = SignatureLevel.USER
    }
    return signatureLevel
}
export const getSignatures = async (signatureLevel: SignatureLevel): Promise<Signatures> => {
    let signatures: Signatures = {accessSecret:"" , refreshSecret:""};

    switch (signatureLevel) {
        case SignatureLevel.ADMIN:
            signatures = {
                accessSecret: process.env.ADMIN_JWT_SECRET_ACCESS as Secret,
                refreshSecret: process.env.ADMIN_JWT_SECRET_REFRESH as Secret
            }
            break;
        case SignatureLevel.USER:
            signatures = {
                accessSecret: process.env.USER_JWT_SECRET_ACCESS as Secret,
                refreshSecret: process.env.USER_JWT_SECRET_REFRESH as Secret
            }
            break;
        default:
            throw new UnauthorizedError({message:"Invalid signature"})
    }
    return signatures
}
export const createCredentials = async (user: HUserDocument): Promise<Credentials> => {
    const signatures : Signatures = await getSignatures(await getSignatureLevel(user.role as RoleEnum))
    const jwtid : string = uuid()
    const accessToken = await generateToken({
        payload: {_id: user._id,},
        secret: signatures.accessSecret,
        options: {
            expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME as StringValue|number,
            jwtid
        }
    })
    const refreshToken = await generateToken({
        payload: {_id: user._id,},
        secret: signatures.refreshSecret,
        options: {
            expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME as StringValue|number,
            jwtid

        }
    })
    return { accessToken, refreshToken }
}
export const decodeToken = async ({
    authorization,
    tokenType = TokenType.ACCESS
} : {
    authorization : string,
    tokenType : TokenType
}): Promise<{user : HUserDocument , decodedToken : JwtPayload}> => {
    const [bearer , token] : string[] = authorization?.split(" ")
    if(!bearer||!token) 
        throw new UnauthorizedError({message:"missing token parts"})
    const signatures = await getSignatures(bearer as unknown as SignatureLevel)
    const decodedToken : JwtPayload = await verifyToken({
        token,
        secret: tokenType === TokenType.ACCESS ? signatures.accessSecret : signatures.refreshSecret
    })
    if(!decodedToken?._id||!decodedToken?.iat||!decodedToken?.jti) 
        throw new UnauthorizedError({message:"Invalid Token Payload"})
    const tokenModel = new TokenReposetory()
    if (await tokenModel.findOne({filter:{jti:decodedToken.jti}}))
        throw new UnauthorizedError({message:"Invalid or Expired Token"})
    const userModel = new UserReposetory()
    const user = await userModel.findOne({filter:{_id:decodedToken._id} , lean:true})
    if(!user) 
        throw new NotFoundError({message:"Account not registered"})
    if(Number(user.credentailsUpdatedAt?.getTime()) > decodedToken.iat * 1000)
        throw new UnauthorizedError({message:"Invalid or Expired Token"})
    return {user , decodedToken}
}
export const generateToken = async ({
    payload,
    secret = process.env.USER_JWT_SECRET_ACCESS as Secret,
    options = { expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME as StringValue | number }
}: {
    payload: string | Buffer | object;
    secret?: Secret | PrivateKey;
    options?: SignOptions
}): Promise<string> => {
    return await jwt.sign(payload, secret, options);
};
export const verifyToken = async ({
    token,
    secret
}: {
    token: string,
    secret: Secret
}) : Promise<JwtPayload> => {
    return await jwt.verify(token, secret) as JwtPayload;
}