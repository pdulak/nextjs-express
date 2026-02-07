import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: false,
  ...(process.env.SMTP_USER
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
    : {}),
});

const from = process.env.SMTP_FROM || "noreply@localhost";

export async function sendActivationEmail(email: string, token: string) {
  const url = `${process.env.WEBSITE_URL}/activate?token=${token}`;
  await transporter.sendMail({
    from,
    to: email,
    subject: "Activate your account",
    html: `<p>Click the link below to activate your account:</p><p><a href="${url}">${url}</a></p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${process.env.WEBSITE_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from,
    to: email,
    subject: "Reset your password",
    html: `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p>`,
  });
}
