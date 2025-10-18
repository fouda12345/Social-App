"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFiles = exports.getFile = exports.uploadFile = exports.createPreSignedUrl = exports.uploadLargeFile = exports.uploadSmallFile = exports.S3Config = exports.isIPresignedUrlFile = exports.creatS3WriteStreamPipeline = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const node_fs_1 = require("node:fs");
const error_handler_1 = require("../../Handlers/error.handler");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const cloud_multer_1 = require("../multer/cloud.multer");
const success_handler_1 = require("../../Handlers/success.handler");
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
exports.creatS3WriteStreamPipeline = (0, node_util_1.promisify)(node_stream_1.pipeline);
const isIPresignedUrlFile = (file) => {
    return (file &&
        typeof file === "object" &&
        "contentType" in file &&
        "originalName" in file);
};
exports.isIPresignedUrlFile = isIPresignedUrlFile;
const S3Config = () => {
    return new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY
        }
    });
};
exports.S3Config = S3Config;
const uploadSmallFile = async ({ Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "General", file }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}-${file.originalname}`,
        Body: file?.buffer || (0, node_fs_1.createReadStream)(file?.path),
        ContentType: file.mimetype
    });
    await (0, exports.S3Config)().send(command);
    if (!command?.input?.Key) {
        throw new error_handler_1.AppError({ message: "File upload failed" });
    }
    return { key: command.input.Key };
};
exports.uploadSmallFile = uploadSmallFile;
const uploadLargeFile = async ({ Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "General", file }) => {
    const upload = new lib_storage_1.Upload({
        client: (0, exports.S3Config)(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}-${file.originalname}`,
            Body: file?.buffer || (0, node_fs_1.createReadStream)(file?.path),
            ContentType: file.mimetype
        },
    });
    upload.on("httpUploadProgress", (progress) => {
        console.log("upload progress", progress);
    });
    const { Key } = await upload.done();
    if (!Key) {
        throw new error_handler_1.AppError({ message: "File upload failed" });
    }
    return { key: Key };
};
exports.uploadLargeFile = uploadLargeFile;
const createPreSignedUrl = async ({ Bucket = process.env.S3_BUCKET_NAME, path = "General", contentType, originalName, expiresIn = 120 }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}-${originalName}`,
        ContentType: contentType
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.S3Config)(), command, {
        expiresIn
    });
    if (!command?.input?.Key || !url) {
        throw new error_handler_1.AppError({ message: "File upload failed" });
    }
    return {
        url,
        key: command.input.Key
    };
};
exports.createPreSignedUrl = createPreSignedUrl;
async function uploadFileFunction({ Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "General", file, files = [], }) {
    if (files && files.length > 0)
        return await Promise.all((files).map(file => uploadFileFunction({ Bucket, ACL, path, file })));
    if (process.env.UPLOAD_TYPE === "DIRECT" && (0, cloud_multer_1.isMulterFile)(file)) {
        if (file.size > 1024 * 1024 * 1024) {
            return await (0, exports.uploadLargeFile)({ Bucket, ACL, path, file });
        }
        return await (0, exports.uploadSmallFile)({ Bucket, ACL, path, file });
    }
    if (process.env.UPLOAD_TYPE === "PRE_SIGNED" && (0, exports.isIPresignedUrlFile)(file))
        return await (0, exports.createPreSignedUrl)({ Bucket, path, contentType: file.contentType, originalName: file.originalName });
    throw new error_handler_1.BadRequestError({ message: "File upload failed missing required data" });
}
exports.uploadFile = uploadFileFunction;
const getFile = async ({ Bucket = process.env.S3_BUCKET_NAME, key, expiresIn = 120, download = "false", downloadName = "done", res, preSigned }) => {
    const ext = "." + key.split('.').pop();
    if (download === "true" && !downloadName.endsWith(ext)) {
        downloadName += ext;
    }
    if (preSigned === "true") {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key: key,
            ResponseContentDisposition: download === "true" ? `attachment; filename="${downloadName}"` : undefined,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.S3Config)(), command, {
            expiresIn
        });
        if (!url) {
            throw new error_handler_1.NotFoundError({ message: "asset not found" });
        }
        (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: url });
    }
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key: key,
    });
    const response = await (0, exports.S3Config)().send(command);
    if (!response || !response.Body) {
        throw new error_handler_1.NotFoundError({ message: "asset not found" });
    }
    res.setHeader('Content-Type', `${response.ContentType || 'application/octet-stream'}`);
    if (download === "true") {
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    }
    return await (0, exports.creatS3WriteStreamPipeline)(response.Body, res);
};
exports.getFile = getFile;
async function deleteFile({ Bucket = process.env.S3_BUCKET_NAME, key, keys, Quiet = false }) {
    let command;
    switch (true) {
        case Boolean(key):
            command = new client_s3_1.DeleteObjectCommand({ Bucket, Key: key });
            return await (0, exports.S3Config)().send(command);
        case keys && keys.length > 0:
            command = new client_s3_1.DeleteObjectsCommand({ Bucket, Delete: { Quiet, Objects: keys.map(key => ({ Key: key })) } });
            return await (0, exports.S3Config)().send(command);
        default:
            throw new error_handler_1.BadRequestError({ message: "failed to delete file missing data" });
    }
}
exports.deleteFiles = deleteFile;
