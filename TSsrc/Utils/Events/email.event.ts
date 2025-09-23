import { EventEmitter } from "node:events";
import Mail from "nodemailer/lib/mailer";
import { generateHtml } from "../Email/generateHtml.utils";
import { sendEmail } from "../Email/send.email";


export interface IEmail extends Mail.Options {
    fullName: string;
    otp: string | number;
}

export const emailEvent = new EventEmitter();

emailEvent.on('confirmEmail', async (data : IEmail) => {
    data.subject = "Confirm your email";
    data.html = generateHtml({
        code: data.otp,
        subject: data.subject,
        name: data.fullName,
        to: data.to as string,
        time: process.env.CODE_EXPIRATION_TIME as string
    });
    await sendEmail(data);
});

emailEvent.on('resetPassword', async (data : IEmail) => {
    data.subject = "Password reset";
    data.html = generateHtml({
        code: data.otp,
        subject: data.subject,
        name: data.fullName,
        to: data.to as string,
        time: process.env.CODE_EXPIRATION_TIME as string
    });
    await sendEmail(data);
});