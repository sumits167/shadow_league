import { mailTransPorter } from '../mailOptions/mailTransPorter.js';


const sendVerificationEmail = async (email, username, verifyCode) => {
    const info = await mailTransPorter.sendMail({
        from: '"Shadow League" <no-reply@gmail.com>',
        to: email,
        subject: 'ShadowLeague | Verification Code',
        text: `Hello ${username}, your verification code is ${verifyCode}.`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6fb;">
                <div style="background: #ffffff; border-radius: 16px; border: 1px solid #dde4f2; padding: 32px;">
                    <h1 style="margin: 0 0 16px; font-size: 24px; color: #1f3b72;">Verify your email</h1>
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4f5f7a;">
                        Hi ${username},<br />
                        Enter the code below to verify your email address and continue setting up your account.
                    </p>
                    <div style="display: inline-block; padding: 20px 28px; background-color: #eef2ff; color: #253d87; font-size: 32px; font-weight: 700; letter-spacing: 6px; border-radius: 14px; margin-bottom: 24px;">
                        ${verifyCode}
                    </div>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">This code will expire in 5 minutes.</p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">If you did not request this, you can safely ignore this email.</p>
                </div>
                <div style="margin-top: 18px; text-align: center; font-size: 12px; color: #9ca3af;">SHADOWLEAGUE • Secure verification from the SHADOWLEAGUE team</div>
            </div>
        `
    });


    console.log("Mail Info : ", info);

    return info;
};

export default sendVerificationEmail;



