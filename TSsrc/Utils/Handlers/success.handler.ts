import { Response } from "express";

export const successHandler = ({ 
    res,
    statusCode = 200,
    message = "Success",
    data = undefined,
} : { 
    res: Response;
    statusCode?: number;
    message?: string;
    data?: Object|undefined;
}) : Response => {
    return res.status(statusCode).json({message , data});
};