import nodemailer from 'nodemailer';
import { env } from '../config';

let testAccount: nodemailer.TestAccount | null = null;
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Use real SMTP if configured
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      secure: parseInt(env.SMTP_PORT) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Otherwise, use Ethereal fake SMTP for testing
  console.log('No SMTP config found. Generating Ethereal test account...');
  testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const mailTransporter = await getTransporter();
  
  const from = testAccount ? '"Memoria Testing" <noreply@ethereal.email>' : env.SMTP_FROM;

  const info = await mailTransporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  console.log(`[Email Sent] Message sent to ${to}: ${info.messageId}`);
  
  if (testAccount) {
    console.log(`[Preview URL] Open this URL in your browser to view the email:`);
    console.log(`-> ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
}
