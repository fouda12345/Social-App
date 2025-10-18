import { JwtPayload } from "jsonwebtoken";
import { HUserDocument } from "../../DB/Models/user.model";

declare module "express-serve-static-core" {
    export interface Request {
        user?:HUserDocument ;
        decodedToken?:JwtPayload
    }
}