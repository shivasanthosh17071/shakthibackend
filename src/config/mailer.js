const nodemailer = require('nodemailer');

let transporter;

/**
 * Lazily creates (and caches) the Nodemailer transporter so we don't pay
 * the connection-setup cost on every import, and so tests can run
 * without SMTP credentials configured.
 */
function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  return transporter;
}

/**
 * Sends an email. Failures are logged but never thrown up into the
 * request/response cycle — a flaky SMTP provider should never fail a
 * user-facing API call (e.g. an order should still be created even if
 * the confirmation email hiccups). Callers that need to guarantee
 * delivery can await this and inspect the return value.
 */
async function sendMail({ to, subject, html }) {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM || '"Shakti Crafts" <no-reply@shakticrafts.com>',
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[mailer] Failed to send "${subject}" to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendMail, getTransporter };
