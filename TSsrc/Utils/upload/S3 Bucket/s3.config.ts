import { ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import { createReadStream } from "node:fs";
import { AppError, BadRequestError } from "../../Handlers/error.handler";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isMulterFile } from "../multer/cloud.multer";

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
