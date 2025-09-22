import jwt, { PrivateKey, Secret, SignOptions } from "jsonwebtoken";
import { RoleEnum, HUserDocument } from "../../DB/Models/user.model";
import type { StringValue } from "ms";

export enum SignatureLevel {
   USER = process.env.USER_BEARER_SIGNATURE_LEVEL as unknown as number,
   ADMIN = process.env.ADMIN_BEARER_SIGNATURE_LEVEL as unknown as number
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
                accessSecret: process.env.HUGK_JWT_SECRET_ACCESS as Secret,
                refreshSecret: process.env.HUGK_JWT_SECRET_REFRESH as Secret
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
export const verifyToken = (token: string, secret: Secret) => {
    return jwt.verify(token, secret);
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

