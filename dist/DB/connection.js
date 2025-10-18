"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const chalk_1 = __importDefault(require("chalk"));
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.DB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(chalk_1.default.white.bgGreen.bold("Connected to Database successfully"));
    }
    catch (error) {
        console.log(chalk_1.default.white.bgRedBright.bold("Error connecting to MongoDB:"));
        console.log(error);
    }
};
exports.connectDB = connectDB;
