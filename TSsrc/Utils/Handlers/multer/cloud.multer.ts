
import { Request } from "express";
import multer, { Multer } from "multer";
import os from "node:os";
import {v4 as uuid} from "uuid";

export const fileFilter = {
    image : ["image/png", "image/jpeg", "image/jpg"],
    video : ["video/mp4", "video/ogg", "video/webm"],
    audio : ["audio/mpeg", "audio/ogg", "audio/webm"],
    document : ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    archive : ["application/zip", "application/x-rar-compressed", "application/vnd.rar"]
}

export enum StorageApproach {
    MEMORY = "MEMORY",
    DISK = "DISK"
}
export const cloudFileUpload  = ({
    filter,
    storageApproach = StorageApproach.MEMORY
} : {
    filter?:string[],
    storageApproach?:StorageApproach
} = {}) : Multer => {
    const fileFilter = (req: Request, file: Express.Multer.File, cb:Function) => {
        if (!filter ||filter && filter.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file format"), false);
        }
    };

    const storage = 
        storageApproach === StorageApproach.MEMORY 
            ? multer.memoryStorage()
            : multer.diskStorage({
                destination: os.tmpdir(),
                filename: (req: Request, file: Express.Multer.File, cb:any) => {
                    cb(null, `${uuid()}-${file.originalname}`);
                }
            });

    return multer({
        storage,
        fileFilter
    })

}