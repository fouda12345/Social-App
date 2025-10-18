"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
const nanoid_1 = require("nanoid");
const generateOtp = (size = 6) => {
    return (0, nanoid_1.customAlphabet)('1234567890', size)();
};
exports.generateOtp = generateOtp;
