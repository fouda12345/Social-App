import { DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, DeleteObjectsCommandOutput, GetObjectCommand, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import { createReadStream } from "node:fs";
import { AppError, BadRequestError, NotFoundError } from "../../Handlers/error.handler";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isMulterFile } from "../multer/cloud.multer";
import { Response } from "express";
import { successHandler } from "../../Handlers/success.handler";
import { promisify } from "node:util";
import { pipeline } from "node:stream";

export const creatS3WriteStreamPipeline = promisify(pipeline);
export type IPresignedUrlData = {
    contentType: string,
    originalName: string
}
export const isIPresignedUrlFile = (file: any): file is IPresignedUrlData => {
    return (
        file &&
        typeof file === "object" &&
        "contentType" in file &&
        "originalName" in file
    );
};
export const S3Config = () => {
    return new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY as string,
            secretAccessKey: process.env.S3_SECRET_KEY as string
        }
    })
}
export const uploadSmallFile = async ({
    Bucket = process.env.S3_BUCKET_NAME as string,
    ACL = "private",
    path = "General",
    file
}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File
}): Promise<{ key: string }> => {
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-${file.originalname}`,
        Body: file?.buffer || createReadStream(file?.path),
        ContentType: file.mimetype
    });

    await S3Config().send(command);

    if (!command?.input?.Key) {
        throw new AppError({ message: "File upload failed" });
    }
    return { key: command.input.Key }
}
export const uploadLargeFile = async ({
    Bucket = process.env.S3_BUCKET_NAME as string,
    ACL = "private",
    path = "General",
    file
}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File
}): Promise<{ key: string }> => {
    const upload = new Upload({
        client: S3Config(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-${file.originalname}`,
            Body: file?.buffer || createReadStream(file?.path),
            ContentType: file.mimetype
        },
    })

    upload.on("httpUploadProgress", (progress) => {
        console.log("upload progress", progress);
    })

    const { Key } = await upload.done();
    if (!Key) {
        throw new AppError({ message: "File upload failed" });
    }
    return { key: Key }
}
export const createPreSignedUrl = async ({
    Bucket = process.env.S3_BUCKET_NAME as string,
    path = "General",
    contentType,
    originalName,
    expiresIn = 120
}: {
    Bucket?: string,
    path?: string,
    contentType: string,
    originalName: string,
    expiresIn?: number
}): Promise<{ url: string, key: string }> => {
    const command = new PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-${originalName}`,
        ContentType: contentType
    })

    const url = await getSignedUrl(S3Config(), command, {
        expiresIn
    })

    if (!command?.input?.Key || !url) {
        throw new AppError({ message: "File upload failed" });
    }
    return {
        url,
        key: command.input.Key
    }

}
async function uploadFileFunction({ Bucket, ACL, path, file }: { Bucket?: string, ACL?: ObjectCannedACL, path?: string, file: Express.Multer.File }): Promise<{ key: string }>
async function uploadFileFunction({Bucket,ACL,path,file}: {Bucket?: string,ACL?: ObjectCannedACL,path?: string,file: Express.Multer.File | IPresignedUrlData}): Promise<{ key: string } | { url: string, key: string }>
async function uploadFileFunction({Bucket,ACL,path,files}: {Bucket?: string,ACL?: ObjectCannedACL,path?: string,files: Express.Multer.File[]}): Promise<{ key: string }[]>
async function uploadFileFunction({Bucket,path,file,}: {Bucket?: string,path?: string,file: IPresignedUrlData}): Promise<{ url: string, key: string }>
async function uploadFileFunction({Bucket,path,files}: { Bucket?: string,path?: string,files: IPresignedUrlData[]}): Promise<{ url: string, key: string }[]>
async function uploadFileFunction({
    Bucket = process.env.S3_BUCKET_NAME as string,
    ACL = "private",
    path = "General",
    file,
    files = [],
}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file?: Express.Multer.File | IPresignedUrlData,
    files?: Express.Multer.File[] | IPresignedUrlData[],
}): Promise<{ key: string } | { key: string }[] | { url: string, key: string } | { url: string, key: string }[]> {
    if (files && files.length > 0)
        return await Promise.all((files).map(file => uploadFileFunction({ Bucket, ACL, path, file })))
    if (process.env.UPLOAD_TYPE === "DIRECT" && isMulterFile(file)) {
        if (file.size > 1024 * 1024 * 1024) {
            return await uploadLargeFile({ Bucket, ACL, path, file });
        }
        return await uploadSmallFile({ Bucket, ACL, path, file });
    }
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED" && isIPresignedUrlFile(file) && file.contentType && file.originalName)
        return await createPreSignedUrl({ Bucket, path, contentType: file.contentType, originalName: file.originalName })
    throw new BadRequestError({ message: "File upload failed missing required data" })
}
export const uploadFile = uploadFileFunction

export const getFile = async ({
    Bucket = process.env.S3_BUCKET_NAME as string,
    key,
    expiresIn = 120,
    download = "false",
    downloadName = "done",
    res,
    preSigned
}: {
    Bucket?: string,
    key: string,
    expiresIn?:number,
    downloadName?: string,
    download?: "true"|"false",
    preSigned?: "true"|"false",
    res: Response
}) : Promise<Response|void> =>{
    const ext = "." + key.split('.').pop()
    if (download === "true" && !downloadName.endsWith(ext)) {
        downloadName += ext
    }
    if (preSigned === "true") {
        const command = new GetObjectCommand({
            Bucket,
            Key: key,
            ResponseContentDisposition : download === "true" ? `attachment; filename="${downloadName}"` : undefined,
        })
        const url = await getSignedUrl(S3Config(), command, {
            expiresIn
        })
        if (!url) {
            throw new NotFoundError({ message: "asset not found" });
        }
        successHandler({ res, statusCode: 200, message: "Success", data: url });
    }
    const command = new GetObjectCommand({
        Bucket,
        Key: key,
    });
    const response = await S3Config().send(command);
    if(!response||!response.Body){ 
        throw new NotFoundError({ message: "asset not found" });
    }
    res.setHeader('Content-Type', `${response.ContentType || 'application/octet-stream'}`);
    if (download === "true") {
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    }
    return await creatS3WriteStreamPipeline((response.Body as NodeJS.ReadableStream), res)
}

async function deleteFile ({
    Bucket,
    key,
}: {
    Bucket?: string,
    key: string
}) : Promise<DeleteObjectCommandOutput>

async function deleteFile ({
    Bucket,
    keys,
    Quiet
}: {
    Bucket?: string,
    keys: string[],
    Quiet?: boolean
}) : Promise<DeleteObjectsCommandOutput>

async function deleteFile ({
    Bucket = process.env.S3_BUCKET_NAME as string,
    key,
    keys,
    Quiet = false
}: {
    Bucket?: string,
    key?: string,
    keys?: string[],
    Quiet?: boolean
}) : Promise<DeleteObjectCommandOutput | DeleteObjectsCommandOutput> {
    let command
    switch(true){
        case Boolean(key):
            command = new DeleteObjectCommand({Bucket, Key: key});
            return await S3Config().send(command);
        case keys && keys.length > 0:
            command = new DeleteObjectsCommand({Bucket, Delete: {Quiet, Objects: keys.map(key => ({Key: key}))}});
            return await S3Config().send(command);
        default:
            throw new BadRequestError({ message: "failed to delete file missing data" })
    }
}

export const deleteFiles = deleteFile