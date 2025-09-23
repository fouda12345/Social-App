"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudFileUpload = exports.StorageApproach = exports.fileFilter = void 0;
const multer_1 = __importDefault(require("multer"));
const node_os_1 = __importDefault(require("node:os"));
const uuid_1 = require("uuid");
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
const cloudFileUpload = ({ filter, storageApproach = StorageApproach.MEMORY } = {}) => {
    const fileFilter = (req, file, cb) => {
        if (!filter || filter && filter.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file format"), false);
        }
    };
    const storage = storageApproach === StorageApproach.MEMORY
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: node_os_1.default.tmpdir(),
            filename: (req, file, cb) => {
                cb(null, `${(0, uuid_1.v4)()}-${file.originalname}`);
            }
        });
    return (0, multer_1.default)({
        storage,
        fileFilter
    });
};
exports.cloudFileUpload = cloudFileUpload;
