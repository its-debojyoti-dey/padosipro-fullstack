import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (config.smtp.user && config.smtp.pass) {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    } else {
      // Create a stream / test transporter if no credentials provided
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'reviewer_test@ethereal.email',
          pass: 'mock_password',
        },
      });
    }
  }
  return transporter;
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (config.logOtpToConsole) {
    console.log('\n=========================================');
    console.log(`[PadosiPro OTP Service]`);
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${otp}`);
    console.log(`Valid for: ${config.otpExpiryMinutes} minutes`);
    console.log('=========================================\n');
  }

  // Attempt real SMTP send if credentials exist
  if (config.smtp.user && config.smtp.pass) {
    try {
      const info = await getTransporter().sendMail({
        from: config.smtp.from,
        to: email,
        subject: `${otp} is your PadosiPro verification code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FAFAF7;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #155C49; margin: 0; font-size: 24px;">PadosiPro</h1>
              <p style="color: #667085; font-size: 14px; margin-top: 4px;">You don't manage tasks — we do.</p>
            </div>
            <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #E5E7EB;">
              <p style="font-size: 15px; color: #202425; margin-top: 0;">Welcome to PadosiPro,</p>
              <p style="font-size: 14px; color: #4B5563; line-height: 1.5;">Please use the following one-time verification code to verify your email address:</p>
              <div style="text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #155C49; background-color: #E8F8F3; padding: 12px 24px; border-radius: 8px; display: inline-block;">${otp}</span>
              </div>
              <p style="font-size: 13px; color: #667085; margin-bottom: 0;">This code will expire in <strong>${config.otpExpiryMinutes} minutes</strong>. For your security, never share this code with anyone.</p>
            </div>
          </div>
        `,
      });
      console.log(`[SMTP] Email sent to ${email}: ${info.messageId}`);
    } catch (err) {
      console.warn(`[SMTP Warning] Could not dispatch email via SMTP (${(err as Error).message}). Console OTP fallback utilized.`);
    }
  }
}
