import { ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {v4 as uuid} from "uuid";
import {createReadStream} from "node:fs";
import { AppError } from "../../Handlers/error.handler";
import { Upload } from "@aws-sdk/lib-storage";


export const S3Config = () => {
    return new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY as string,
            secretAccessKey: process.env.S3_SECRET_KEY as string
        }
    })
} 

export const uploadSmallFile = async({
    Bucket = process.env.S3_BUCKET_NAME as string,
    ACL = "private",
    path = "General",
    file
}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File
}) : Promise<string> => {
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key:`${process.env.APPLICATION_NAME}/${path}/${uuid()}-${file.originalname}`,
        Body:  file?.buffer || createReadStream(file?.path),
        ContentType: file.mimetype
    });

    await S3Config().send(command);

    if (!command?.input?.Key) {
        throw new AppError({message: "File upload failed"});
    }
    return command.input.Key
}

export const uploadLargeFile = async({
    Bucket = process.env.S3_BUCKET_NAME as string,
    ACL = "private",
    path = "General",
    file
}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File
}) : Promise<string> => {
    const upload = new Upload({
        client: S3Config(),
        params: {
            Bucket,
            ACL,
            Key:`${process.env.APPLICATION_NAME}/${path}/${uuid()}-${file.originalname}`,
            Body:  file?.buffer || createReadStream(file?.path),
            ContentType: file.mimetype
        },
    })
    
    upload.on("httpUploadProgress", (progress) => {
        console.log("upload progress", progress);
    })
   
    const { Key } = await upload.done();
    if (!Key) {
        throw new AppError({message: "File upload failed"});
    }
    return Key
}

export const uploadFile = async({
    Bucket = process.env.S3_BUCKET_NAME as string,
    ACL = "private",
    path = "General",
    file
}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File
}) : Promise<string> => {
    if (file.size > 1024 * 1024 * 1024) {
        return await uploadLargeFile({Bucket, ACL, path, file});
    }
    return await uploadSmallFile({Bucket, ACL, path, file});
}

export const uploadFiles = async({
    Bucket = process.env.S3_BUCKET_NAME as string,
    ACL = "private",
    path = "General",
    files
}: {
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    files: Express.Multer.File[]
}) : Promise<string[]> => {
    return await Promise.all(files.map(file => uploadFile({Bucket, ACL, path, file})));
}