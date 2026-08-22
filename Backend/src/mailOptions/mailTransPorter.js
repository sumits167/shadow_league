import { mailConfig } from "./mailConfig.js";
import nodeMailer from 'nodemailer'


export const mailTransPorter=nodeMailer.createTransport(mailConfig);