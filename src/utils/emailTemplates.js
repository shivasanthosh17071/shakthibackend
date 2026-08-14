/**
 * All outbound HTML email templates for Shakti Crafts.
 *
 * Every template is built on top of `baseLayout`, which gives every
 * email the same header/footer/brand styling. Each exported function
 * returns { subject, html } ready to hand straight to sendMail().
 */

const BRAND_COLOR = '#8B4513'; // warm terracotta/brown, evokes handcrafted art
const BRAND_NAME = 'Shakti Crafts';

function baseLayout({ title, bodyHtml, ctaText, ctaUrl }) {
  const ctaBlock = ctaText && ctaUrl
    ? `
      <tr>
        <td style="padding: 24px 0;" align="center">
          <a href="${ctaUrl}"
             style="background:${BRAND_COLOR}; color:#ffffff; text-decoration:none;
                    padding:14px 32px; border-radius:6px; font-weight:600;
                    font-family:Arial,Helvetica,sans-serif; font-size:15px; display:inline-block;">
            ${ctaText}
          </a>
        </td>
      </tr>`
    : '';

  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0; padding:0; background-color:#f5f1eb; font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1eb; padding:32px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="background:${BRAND_COLOR}; padding:24px 32px;">
                <span style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.5px;">
                  ${BRAND_NAME}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px; color:#2b2b2b; font-size:20px;">${title}</h2>
                <div style="color:#4a4a4a; font-size:15px; line-height:1.6;">
                  ${bodyHtml}
                </div>
              </td>
            </tr>
            ${ctaBlock}
            <tr>
              <td style="padding:20px 32px; background:#faf8f4; color:#999; font-size:12px; text-align:center;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

function verifyEmailTemplate({ name, verifyUrl }) {
  return {
    subject: 'Verify your email — Shakti Crafts',
    html: baseLayout({
      title: `Welcome, ${name}!`,
      bodyHtml: `
        <p>Thanks for joining Shakti Crafts. Please confirm your email address to activate your account.</p>
        <p>This link expires in 24 hours.</p>`,
      ctaText: 'Verify Email',
      ctaUrl: verifyUrl,
    }),
  };
}

function sellerApplicationReceivedTemplate({ name }) {
  return {
    subject: 'Your seller application was received — Shakti Crafts',
    html: baseLayout({
      title: `Thanks for applying, ${name}`,
      bodyHtml: `
        <p>We've received your application to sell on Shakti Crafts. Our team will review your
        profile and sample work shortly, and you'll get an email as soon as a decision is made.</p>`,
    }),
  };
}

function sellerApplicationAdminNotifyTemplate({ applicantName, applicantEmail }) {
  return {
    subject: `New seller application: ${applicantName}`,
    html: baseLayout({
      title: 'New seller application',
      bodyHtml: `
        <p><strong>${applicantName}</strong> (${applicantEmail}) has applied to become a seller.</p>
        <p>Please review their application in the admin dashboard.</p>`,
    }),
  };
}

function sellerApprovedTemplate({ name, loginUrl }) {
  return {
    subject: "You're approved to sell on Shakti Crafts!",
    html: baseLayout({
      title: `Congratulations, ${name}!`,
      bodyHtml: `
        <p>Your seller application has been approved. You can now log in and start listing your art
        for buyers to discover.</p>`,
      ctaText: 'Log In & Start Listing',
      ctaUrl: loginUrl,
    }),
  };
}

function sellerRejectedTemplate({ name, reason }) {
  return {
    subject: 'Update on your Shakti Crafts seller application',
    html: baseLayout({
      title: `Hi ${name}, about your application`,
      bodyHtml: `
        <p>Thanks for your interest in selling on Shakti Crafts. After review, we're unable to
        approve your application at this time.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You're welcome to update your profile and reapply at any time.</p>`,
    }),
  };
}

function orderPlacedTemplate({ name, paintingTitle, amount, orderUrl }) {
  return {
    subject: `Order confirmed — ${paintingTitle}`,
    html: baseLayout({
      title: `Thanks for your order, ${name}!`,
      bodyHtml: `
        <p>We've received your order for <strong>${paintingTitle}</strong> (₹${amount}).</p>
        <p>Please complete payment and upload proof so the seller can verify it and confirm your order.</p>`,
      ctaText: 'View Order',
      ctaUrl: orderUrl,
    }),
  };
}

function paymentProofSubmittedTemplate({ sellerName, paintingTitle, orderUrl }) {
  return {
    subject: `New payment proof to review — ${paintingTitle}`,
    html: baseLayout({
      title: `Hi ${sellerName}, action needed`,
      bodyHtml: `
        <p>A buyer has submitted payment proof for <strong>${paintingTitle}</strong>. Please review
        it and verify or reject the payment.</p>`,
      ctaText: 'Review Payment',
      ctaUrl: orderUrl,
    }),
  };
}

function paymentVerifiedTemplate({ name, paintingTitle, orderUrl }) {
  return {
    subject: `Payment verified — order confirmed!`,
    html: baseLayout({
      title: `Great news, ${name}!`,
      bodyHtml: `
        <p>Your payment for <strong>${paintingTitle}</strong> has been verified and your order is
        now confirmed. The seller will begin preparing it for shipment.</p>`,
      ctaText: 'View Order',
      ctaUrl: orderUrl,
    }),
  };
}

function paymentRejectedTemplate({ name, paintingTitle, reason, orderUrl }) {
  return {
    subject: `Payment could not be verified — ${paintingTitle}`,
    html: baseLayout({
      title: `Hi ${name}, we need another look`,
      bodyHtml: `
        <p>We couldn't verify your payment proof for <strong>${paintingTitle}</strong>.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please resubmit your payment proof so we can confirm your order.</p>`,
      ctaText: 'Resubmit Payment Proof',
      ctaUrl: orderUrl,
    }),
  };
}

function orderShippedTemplate({ name, paintingTitle, trackingNote, orderUrl }) {
  return {
    subject: `Your order has shipped — ${paintingTitle}`,
    html: baseLayout({
      title: `${paintingTitle} is on its way, ${name}!`,
      bodyHtml: `
        <p>Your order has been shipped.</p>
        <div style="background:#faf8f4; border-left:3px solid ${BRAND_COLOR}; padding:12px 16px; margin:16px 0;">
          <strong>Tracking details:</strong><br/>${trackingNote || 'No tracking details provided.'}
        </div>`,
      ctaText: 'Track Order',
      ctaUrl: orderUrl,
    }),
  };
}

function orderDeliveredTemplate({ name, paintingTitle, orderUrl }) {
  return {
    subject: `Delivered — ${paintingTitle}`,
    html: baseLayout({
      title: `Enjoy your new piece, ${name}!`,
      bodyHtml: `
        <p>Your order for <strong>${paintingTitle}</strong> has been marked as delivered. We hope it
        brings you joy for years to come!</p>`,
      ctaText: 'View Order',
      ctaUrl: orderUrl,
    }),
  };
}

function newsletterAdminNotifyTemplate({ email }) {
  return {
    subject: `New newsletter subscriber: ${email}`,
    html: baseLayout({
      title: 'New newsletter subscriber',
      bodyHtml: `<p><strong>${email}</strong> just subscribed to Gallery Notes.</p>`,
    }),
  };
}

function paintingBlockedTemplate({ name, paintingTitle, reason }) {
  return {
    subject: `Your listing "${paintingTitle}" has been blocked`,
    html: baseLayout({
      title: `Hi ${name}, a listing needs your attention`,
      bodyHtml: `
        <p>Your painting <strong>${paintingTitle}</strong> has been blocked and is no longer
        visible to buyers.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You can still view and edit it from your seller dashboard. It will go back live as soon
        as an admin unblocks it.</p>`,
    }),
  };
}

function paintingUnblockedTemplate({ name, paintingTitle }) {
  return {
    subject: `Your listing "${paintingTitle}" is live again`,
    html: baseLayout({
      title: `Good news, ${name}!`,
      bodyHtml: `
        <p>Your painting <strong>${paintingTitle}</strong> has been unblocked and is visible to
        buyers again.</p>`,
    }),
  };
}

function accountBlockedTemplate({ name, reason }) {
  return {
    subject: 'Your Shakti Crafts account has been blocked',
    html: baseLayout({
      title: `Hi ${name}`,
      bodyHtml: `
        <p>Your account has been blocked and you will not be able to log in until it's
        reinstated.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>If you believe this is a mistake, please reply to this email.</p>`,
    }),
  };
}

function accountUnblockedTemplate({ name }) {
  return {
    subject: 'Your Shakti Crafts account has been reinstated',
    html: baseLayout({
      title: `Welcome back, ${name}!`,
      bodyHtml: `<p>Your account has been unblocked. You can log in as usual.</p>`,
    }),
  };
}

module.exports = {
  verifyEmailTemplate,
  sellerApplicationReceivedTemplate,
  sellerApplicationAdminNotifyTemplate,
  sellerApprovedTemplate,
  sellerRejectedTemplate,
  orderPlacedTemplate,
  paymentProofSubmittedTemplate,
  paymentVerifiedTemplate,
  paymentRejectedTemplate,
  orderShippedTemplate,
  orderDeliveredTemplate,
  newsletterAdminNotifyTemplate,
  paintingBlockedTemplate,
  paintingUnblockedTemplate,
  accountBlockedTemplate,
  accountUnblockedTemplate,
};
