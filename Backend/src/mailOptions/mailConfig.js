
import dotenv from 'dotenv';
dotenv.config();
import nodeMailer from 'nodemailer'


const testAccount = await nodeMailer.createTestAccount();

export const mailConfig = {
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
        user: testAccount.user,
        pass: testAccount.pass
    }
}
