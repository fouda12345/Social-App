"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMulterFile = exports.cloudFileUpload = exports.StorageApproach = exports.fileFilter = void 0;
const multer_1 = __importDefault(require("multer"));
const node_os_1 = __importDefault(require("node:os"));
const uuid_1 = require("uuid");
const error_handler_1 = require("../../Handlers/error.handler");
exports.fileFilter = {
    image: ["image/png", "image/jpeg", "image/jpg"],
    video: ["video/mp4", "video/ogg", "video/webm"],
    audio: ["audio/mpeg", "audio/ogg", "audio/webm"],
    document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    archive: ["application/zip", "application/x-rar-compressed", "application/vnd.rar"]
};
var StorageApproach;
(function (StorageApproach) {
    StorageApproach["MEMORY"] = "MEMORY";
    StorageApproach["DISK"] = "DISK";
})(StorageApproach || (exports.StorageApproach = StorageApproach = {}));
const cloudFileUpload = ({ storageApproach = StorageApproach.MEMORY, filter = exports.fileFilter.image, maxSize = 2 }) => {
    const fileFilter = (req, file, cb) => {
        if (!filter?.includes(file.mimetype))
            cb(new error_handler_1.BadRequestError({ message: "Invalid file format" }));
        cb(null, true);
    };
    const storage = storageApproach === StorageApproach.MEMORY && maxSize <= 1024
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: node_os_1.default.tmpdir(),
            filename: (req, file, cb) => {
                cb(null, `${(0, uuid_1.v4)()}-${file.originalname}`);
            }
        });
    return (0, multer_1.default)({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize * 1024 * 1024
        }
    });
};
exports.cloudFileUpload = cloudFileUpload;
const isMulterFile = (file) => {
    return (file &&
        typeof file === "object" &&
        "fieldname" in file &&
        "originalname" in file &&
        "mimetype" in file &&
        "size" in file);
};
exports.isMulterFile = isMulterFile;
