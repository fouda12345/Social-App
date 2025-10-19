"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupSchema = exports.createGroupSchema = exports.getChatSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../Middlewares/validation.middleware");
exports.getChatSchema = zod_1.default.object({
    params: zod_1.default.strictObject({
        userId: validation_middleware_1.generalFields.id
    })
});
exports.createGroupSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        group: zod_1.default.string().min(2).max(20),
        participants: zod_1.default.array(validation_middleware_1.generalFields.id).min(1)
    }).superRefine((data, ctx) => {
        if (data.participants.length != new Set(data.participants).size) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Duplicate participants are not allowed"
            });
        }
    })
});
exports.getGroupSchema = zod_1.default.object({
    params: zod_1.default.strictObject({
        groupId: validation_middleware_1.generalFields.id
    })
});
