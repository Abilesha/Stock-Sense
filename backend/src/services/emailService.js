const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM || 'StockSense Security <onboarding@resend.dev>';
  }

  async sendOtpEmail(toEmail, otp, userName = 'User') {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f141c; color: #f0f4f9; margin: 0; padding: 30px 10px; }
        .card { max-width: 500px; margin: 0 auto; background: #18202c; border: 1px solid #2a374b; border-radius: 12px; padding: 32px; box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .logo { background: #f59e0b; color: #1c1305; font-weight: 800; font-size: 18px; width: 34px; height: 34px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 34px; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0; }
        .otp-box { background: #202a3a; border: 2px dashed #f59e0b; border-radius: 10px; text-align: center; padding: 20px; margin: 24px 0; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; margin: 0; }
        .text { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 12px 0; }
        .footer { margin-top: 30px; border-top: 1px solid #2a374b; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">
          <div class="logo">S</div>
          <span style="font-weight: 700; font-size: 18px; color: #f0f4f9;">StockSense IMS</span>
        </div>
        <h2 class="title">Password Reset Verification</h2>
        <p class="text">Hello <strong>${userName}</strong>,</p>
        <p class="text">We received a request to reset your password for your StockSense Inventory account. Use the one-time verification code below to complete the reset:</p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>

        <p class="text" style="color: #cbd5e1;">⚠️ This verification code is valid for <strong>15 minutes</strong> and can only be used once.</p>
        <p class="text" style="font-size: 13px;">If you did not request a password reset, please ignore this email or contact your inventory administrator immediately.</p>
        
        <div class="footer">
          &copy; ${new Date().getFullYear()} StockSense IMS &bull; Enterprise Stock Accounting Platform
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      console.log(`[Resend] Dispatching OTP email to: ${toEmail}...`);
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [toEmail],
        subject: `Your StockSense Verification Code is ${otp}`,
        html: htmlContent,
      });

      if (error) {
        console.error('[Resend API Error]:', error);
        return { success: false, error: error.message || JSON.stringify(error) };
      }

      console.log(`[Resend] Email sent successfully. ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error('[Resend Error]:', err);
      return { success: false, error: err.message || 'Failed to send email via Resend.' };
    }
  }
}

module.exports = new EmailService();
