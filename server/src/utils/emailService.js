const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

const getTransporter = () => {
  if (!transporter && config.smtp.host && config.smtp.user) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn('Email not configured - skipping send');
    return null;
  }

  const mailOptions = {
    from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };

  return transport.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ERP Management</h1>
      </div>
      <div style="padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #1E293B; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #475569; line-height: 1.6;">
          You requested a password reset. Click the button below to set a new password.
          This link will expire in <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background: #2563EB; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 8px; font-weight: 600;
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #94A3B8; font-size: 14px;">
          If you didn't request this, please ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
        <p style="color: #94A3B8; font-size: 12px;">
          If the button doesn't work, copy and paste this link:<br>
          <a href="${resetUrl}" style="color: #2563EB;">${resetUrl}</a>
        </p>
      </div>
      <div style="background: #F8FAFC; padding: 16px 24px; text-align: center;">
        <p style="color: #94A3B8; font-size: 12px; margin: 0;">
          ERP Management System
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset - ERP Management',
    html,
  });
};

const sendOrderConfirmationEmail = async (email, orderData) => {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">${item.productTitle}</td>
      <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">$${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ERP Management</h1>
      </div>
      <div style="padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #1E293B; margin-top: 0;">Order Confirmation</h2>
        <p style="color: #475569;">Order <strong>${orderData.orderNumber}</strong> has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #F8FAFC;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #E2E8F0;">Product</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #E2E8F0;">Qty</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E2E8F0;">Price</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #E2E8F0;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: right; margin-top: 16px;">
          <p style="color: #1E293B; font-size: 18px; font-weight: 600;">
            Total: $${orderData.totalPrice.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmation - ${orderData.orderNumber}`,
    html,
  });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
