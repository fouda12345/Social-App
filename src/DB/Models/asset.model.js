"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetModel = exports.assetShema = void 0;
const mongoose_1 = require("mongoose");
exports.assetShema = new mongoose_1.Schema({
    key: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });
exports.assetModel = mongoose_1.models.Asset || (0, mongoose_1.model)('Asset', exports.assetShema);
