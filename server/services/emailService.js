const nodemailer = require("nodemailer");

const hasSmtp = Boolean(process.env.SMTP_HOST);
const transporter = hasSmtp ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
}) : null;

const sendPasswordReset = async ({ to, resetUrl }) => {
  if (!transporter) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP is not configured");
    console.log("[development password reset] " + resetUrl);
    return { previewUrl: resetUrl };
  }

  const html = [
    '<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">',
    '<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0">',
    '<div style="background:#020617;padding:28px;color:#fff"><strong style="font-size:20px">CarBooking</strong></div>',
    '<div style="padding:32px"><h1 style="margin:0 0 14px;font-size:26px">Reset your password</h1>',
    '<p style="color:#64748b;line-height:1.7">We received a request to reset your password. This secure link expires in 15 minutes.</p>',
    '<a href="' + resetUrl + '" style="display:inline-block;margin:16px 0;background:#2563eb;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:bold">Choose a new password</a>',
    '<p style="color:#94a3b8;font-size:13px;line-height:1.6">If you did not request this change, ignore this email. Your current password remains active.</p>',
    '</div></div></body></html>',
  ].join("");

  await transporter.sendMail({
    from: process.env.MAIL_FROM || "CarBooking <no-reply@carbooking.local>",
    to,
    subject: "Reset your CarBooking password",
    text: ["Reset your password using this link: " + resetUrl, "This link expires in 15 minutes. If you did not request it, ignore this email."].join(String.fromCharCode(10, 10)),
    html,
  });
  return {};
};

module.exports = { sendPasswordReset };
