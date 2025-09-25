import { NextFunction, Request, Response } from "express";
import { getFile } from "../upload/S3 Bucket/s3.config";


export const getAssets = async (req: Request, res: Response , next: NextFunction) : Promise<Response|void> => {
    const {path} = req.params as unknown as  {path: string[]}
    let {downloadName , download , preSigned} = req.query as unknown as {downloadName: string, download: "true" | "false" , preSigned: "true" | "false"}
    const key: string = path.join('/')
    return getFile({
        key,
        downloadName,
        download,
        preSigned,
        res
    })
}