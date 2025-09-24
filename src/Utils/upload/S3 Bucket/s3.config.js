"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = exports.uploadFile = exports.uploadLargeFile = exports.uploadSmallFile = exports.S3Config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const node_fs_1 = require("node:fs");
const error_handler_1 = require("../../Handlers/error.handler");
const lib_storage_1 = require("@aws-sdk/lib-storage");
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
    return command.input.Key;
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
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
const uploadFile = async ({ Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "General", file }) => {
    if (file.size > 1024 * 1024 * 1024) {
        return await (0, exports.uploadLargeFile)({ Bucket, ACL, path, file });
    }
    return await (0, exports.uploadSmallFile)({ Bucket, ACL, path, file });
};
exports.uploadFile = uploadFile;
const uploadFiles = async ({ Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "General", files }) => {
    return await Promise.all(files.map(file => (0, exports.uploadFile)({ Bucket, ACL, path, file })));
};
exports.uploadFiles = uploadFiles;
