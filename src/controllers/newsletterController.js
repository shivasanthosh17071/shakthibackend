const Subscriber = require('../models/Subscriber');
const { sendMail } = require('../config/mailer');
const { newsletterAdminNotifyTemplate } = require('../utils/emailTemplates');

/**
 * POST /api/newsletter/subscribe (public)
 * Idempotent — resubscribing with the same email is always a 200, and the
 * admin is only notified the first time an address subscribes.
 */
async function subscribe(req, res, next) {
  try {
    const { email } = req.body;

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(200).json({ message: "You're already subscribed." });
    }

    await Subscriber.create({ email });

    if (process.env.ADMIN_NOTIFY_EMAIL) {
      const { subject, html } = newsletterAdminNotifyTemplate({ email });
      await sendMail({ to: process.env.ADMIN_NOTIFY_EMAIL, subject, html });
    }

    res.status(201).json({ message: 'Subscribed! Thanks for joining.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { subscribe };
