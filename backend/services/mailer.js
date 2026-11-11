const nodemailer = require("nodemailer");
const { appUrl, smtp } = require("../config/env");

const configured = Boolean(smtp.user && smtp.pass);

const transporter = configured
    ? nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.port === 465,
          auth: { user: smtp.user, pass: smtp.pass },
      })
    : null;

// Sends an email. If SMTP isn't configured, logs the message so local dev still works.
async function sendMail({ to, subject, text, html }) {
    if (!transporter) {
        console.log(`[mailer] SMTP not configured; would send to ${to}: ${subject}\n${text}`);
        return;
    }
    await transporter.sendMail({ from: smtp.from, to, subject, text, html });
}

function button(url, label) {
    return `<p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">${label}</a></p>
<p>Or paste this link into your browser:<br>${url}</p>`;
}

async function sendVerificationEmail(email, token) {
    const url = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    await sendMail({
        to: email,
        subject: "Verify your email",
        text: `Welcome! Verify your email (link expires in 24 hours):\n${url}`,
        html: `<p>Welcome! Verify your email to finish creating your account. This link expires in 24 hours.</p>${button(url, "Verify email")}`,
    });
}

async function sendPasswordResetEmail(email, token) {
    const url = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendMail({
        to: email,
        subject: "Reset your password",
        text: `Reset your password (link expires in 24 hours). If you didn't request this, ignore this email:\n${url}`,
        html: `<p>We received a request to reset your password. This link expires in 24 hours. If you didn't request it, ignore this email.</p>${button(url, "Reset password")}`,
    });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
