import chalk from "chalk";
import { createTransport, Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { IEmail } from "../Events/email.event";


export const sendEmail = async(data: IEmail) : Promise<void> => {
    const transporter : Transporter<
        SMTPTransport.SentMessageInfo,
        SMTPTransport.Options
    > = createTransport({
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
    .then(() => console.log(chalk.white.bgGreen.bold("Message sent to: %s"), data.to))
    .catch((error) => {
        console.log(chalk.white.bgRed.bold("Error sending email to: %s"), data.to)
        console.log(error)
    });
}