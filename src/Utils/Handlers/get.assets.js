"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssets = void 0;
const s3_config_1 = require("../upload/S3 Bucket/s3.config");
const getAssets = async (req, res, next) => {
    const { path } = req.params;
    let { downloadName, download, preSigned } = req.query;
    const key = path.join('/');
    return (0, s3_config_1.getFile)({
        key,
        downloadName,
        download,
        preSigned,
        res
    });
};
exports.getAssets = getAssets;
