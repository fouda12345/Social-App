"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHash = exports.generateHash = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const generateHash = async ({ data, saltRound = Number(process.env.SALT_ROUND) }) => {
    return await bcrypt_1.default.hash(data, saltRound);
};
exports.generateHash = generateHash;
const compareHash = async ({ data, hash }) => {
    return await bcrypt_1.default.compare(data, hash);
};
exports.compareHash = compareHash;
