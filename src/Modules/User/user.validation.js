"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutSchema = exports.logoutFlag = void 0;
const zod_1 = __importDefault(require("zod"));
var logoutFlag;
(function (logoutFlag) {
    logoutFlag["ALL"] = "ALL";
    logoutFlag["ONLY"] = "ONLY";
})(logoutFlag || (exports.logoutFlag = logoutFlag = {}));
exports.logoutSchema = zod_1.default.object({
    body: zod_1.default.strictObject({
        flag: zod_1.default.enum(logoutFlag).default(logoutFlag.ONLY)
    })
});
