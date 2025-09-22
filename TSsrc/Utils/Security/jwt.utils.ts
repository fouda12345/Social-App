import jwt, { JwtPayload, PrivateKey, Secret, SignOptions } from "jsonwebtoken";
import { RoleEnum, HUserDocument } from "../../DB/Models/user.model";
import type { StringValue } from "ms";
import { NotFoundError, UnAuthorizedError } from "../Handlers/error.handler";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";


export enum TokenType {
    ACCESS = "ACCESS",
    REFRESH = "REFRESH"
}
export enum SignatureLevel {
   USER = "rttwr",
   ADMIN = "dyhsrft"
}
export type Signatures = {
    accessSecret: Secret,
    refreshSecret: Secret,
}
export type Credentials = {
    accessToken?: string,
    refreshToken?: string
}
export const getSignatureLevel = async (role: RoleEnum = RoleEnum.USER) : Promise<SignatureLevel> => {
    let signatureLevel = SignatureLevel.USER
    switch (role) {
        case RoleEnum.ADMIN:
            signatureLevel = SignatureLevel.ADMIN
            break;
        default:
            signatureLevel = SignatureLevel.USER
    }
    return signatureLevel
}
export const getSignatures = async (signatureLevel: SignatureLevel = SignatureLevel.USER): Promise<Signatures> => {
    let signatures: Signatures = {accessSecret:"" , refreshSecret:""};
    switch (signatureLevel) {
        case SignatureLevel.ADMIN:
            signatures = {
                accessSecret: process.env.ADMIN_JWT_SECRET_ACCESS as Secret,
                refreshSecret: process.env.ADMIN_JWT_SECRET_REFRESH as Secret
            }
            break;
        default:
            signatures = {
                accessSecret: process.env.USER_JWT_SECRET_ACCESS as Secret,
                refreshSecret: process.env.USER_JWT_SECRET_REFRESH as Secret
            }
    }
    return signatures
}
export const createCredentials = async (user: HUserDocument): Promise<Credentials> => {
    const signatures : Signatures = await getSignatures(await getSignatureLevel(user.role))
    const accessToken = await generateToken({
        payload: {id: user._id,},
        secret: signatures.accessSecret,
        options: {
            expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME as StringValue|number
        }
    })
    const refreshToken = await generateToken({
        payload: {id: user._id,},
        secret: signatures.refreshSecret,
        options: {
            expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME as StringValue|number

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
        throw new UnAuthorizedError({message:"missing token parts"})
    const signatures = await getSignatures(bearer as unknown as SignatureLevel)
    const decodedToken : JwtPayload = await verifyToken({
        token,
        secret: tokenType === TokenType.ACCESS ? signatures.accessSecret : signatures.refreshSecret
    })
    if(!decodedToken?.id||!decodedToken?.iat) 
        throw new UnAuthorizedError({message:"Invalid Token Payload"})
    const userModel = new UserReposetory()
    const user = await userModel.findOne({filter:{_id:decodedToken.id}})
    if(!user) throw new NotFoundError({message:"Account not registered"})

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

