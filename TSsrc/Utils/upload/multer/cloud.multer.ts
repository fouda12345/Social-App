
import { Request } from "express";
import multer, { FileFilterCallback, Multer } from "multer";
import os from "node:os";
import {v4 as uuid} from "uuid";
import { BadRequestError } from "../../Handlers/error.handler";

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
    storageApproach = StorageApproach.MEMORY,
    filter = fileFilter.image,
    maxSize = 2
} : {
    storageApproach?:StorageApproach
    filter?:string[],
    maxSize?:number
}) : Multer => {
    const fileFilter = (req: Request, file: Express.Multer.File, cb:FileFilterCallback) => {
        if (!filter?.includes(file.mimetype))
            cb(new BadRequestError({message:"Invalid file format"}));
        cb(null, true);
    };

    const storage = storageApproach === StorageApproach.MEMORY && maxSize <= 1024
        ? multer.memoryStorage()
        : multer.diskStorage({
            destination: os.tmpdir(),
            filename: (req, file, cb) => {
                cb(null, `${uuid()}-${file.originalname}`);
            }
        });
        

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize * 1024 * 1024
        }
    })

}