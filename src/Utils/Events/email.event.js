"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = require("node:events");
const generateHtml_utils_1 = require("../Email/generateHtml.utils");
const send_email_1 = require("../Email/send.email");
exports.emailEvent = new node_events_1.EventEmitter();
exports.emailEvent.on('confirmEmail', async (data) => {
    data.subject = "Confirm your email";
    data.html = (0, generateHtml_utils_1.generateHtml)({
        code: data.otp,
        subject: data.subject,
        name: data.fullName,
        to: data.to,
        time: process.env.CODE_EXPIRATION_TIME
    });
    await (0, send_email_1.sendEmail)(data);
});
