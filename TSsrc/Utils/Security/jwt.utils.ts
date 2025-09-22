import jwt, { PrivateKey, Secret, SignOptions } from "jsonwebtoken";
import { RoleEnum } from "../../DB/Models/user.model";
type Unit =
        | "Years"
        | "Year"
        | "Yrs"
        | "Yr"
        | "Y"
        | "Weeks"
        | "Week"
        | "W"
        | "Days"
        | "Day"
        | "D"
        | "Hours"
        | "Hour"
        | "Hrs"
        | "Hr"
        | "H"
        | "Minutes"
        | "Minute"
        | "Mins"
        | "Min"
        | "M"
        | "Seconds"
        | "Second"
        | "Secs"
        | "Sec"
        | "s"
        | "Milliseconds"
        | "Millisecond"
        | "Msecs"
        | "Msec"
        | "Ms";

type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;

export type StringValue =
        | `${number}`
        | `${number}${UnitAnyCase}`
        | `${number} ${UnitAnyCase}`;



export enum TokenType {
    ACCESS = "ACCESS",
    REFRESH = "REFRESH"
}
export const getSecretAndExpireTimefromRole = (role: RoleEnum) : {accessSecret: string , accessExpireTime: StringValue , refreshSecret: string , refreshExpireTime: StringValue} => {
    return {
        accessSecret : process.env[`${role}_JWT_SECRET_${TokenType.ACCESS}`] as string,
        accessExpireTime : process.env[`JWT_${TokenType.ACCESS}_EXPIRE_TIME`] as StringValue,
        refreshSecret : process.env[`${role}_JWT_SECRET_${TokenType.REFRESH}`] as string,
        refreshExpireTime : process.env[`JWT_${TokenType.REFRESH}_EXPIRE_TIME`] as StringValue
    }
}
export const verifyToken = (token: string , secret: Secret) => {
    return jwt.verify(token, secret);
}
export const generateToken = async ({
    payload,
    secret = process.env.USER_JWT_SECRET_ACCESS as string,
    options = {expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME as StringValue}
} : {
    payload: string | Buffer | object;
    secret?: Secret | PrivateKey;
    options?: SignOptions
}) : Promise<string> => {
    return await jwt.sign(payload, secret, options);
};