"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const chalk_1 = __importDefault(require("chalk"));
const nodemailer_1 = require("nodemailer");
const sendEmail = async (data) => {
    const transporter = (0, nodemailer_1.createTransport)({
        service: "gmail",
        auth: {
            user: process.env.GOOGLE_APP_USER,
            pass: process.env.GOOGLE_APP_PASSWORD,
        },
    });
    await transporter.sendMail({
        ...data,
        from: `"Social App" <${process.env.GOOGLE_APP_USER}>`
    })
        .then(() => console.log(chalk_1.default.white.bgGreen.bold("Message sent to: %s"), data.to))
        .catch((error) => {
        console.log(chalk_1.default.white.bgRed.bold("Error sending email to: %s"), data.to);
        console.log(error);
    });
};
exports.sendEmail = sendEmail;
