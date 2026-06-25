const sgMail = require('@sendgrid/mail');

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@azadi-unfoldyourmyth.org';

// ========== SEND VERIFICATION EMAIL ==========
async function sendVerificationEmail(to, code, fullName) {
  const msg = {
    to: to,
    from: FROM_EMAIL,
    subject: 'Verify Your Email - Azadi Global',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #00375c;">Azadi Global</h1>
          <p style="color: #666;">Cross-Border Academic Legacy</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #00375c;">Welcome, ${fullName || 'Scholar'}!</h2>
          <p style="color: #333; line-height: 1.6;">Thank you for joining Azadi Global. Please verify your email address by entering the code below:</p>
          
          <div style="text-align: center; padding: 20px 0;">
            <div style="display: inline-block; background: #f0f7ff; padding: 15px 40px; border-radius: 8px; border: 2px dashed #00375c;">
              <span style="font-size: 32px; font-weight: bold; color: #00375c; letter-spacing: 8px;">${code}</span>
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you didn't request this, please ignore this email.<br>
            © 2025 Azadi Global. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email error:', error.response?.body || error.message);
    return { success: false, error: error.message };
  }
}

// ========== SEND WELCOME EMAIL ==========
async function sendWelcomeEmail(to, fullName) {
  const msg = {
    to: to,
    from: FROM_EMAIL,
    subject: 'Welcome to Azadi Global! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #00375c;">Azadi Global</h1>
          <p style="color: #666;">Cross-Border Academic Legacy</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #00375c;">Welcome, ${fullName || 'Scholar'}! 🎓</h2>
          <p style="color: #333; line-height: 1.6;">Your journey to global education begins now. You are now part of the Azadi community.</p>
          
          <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #00375c; margin-bottom: 10px;">What's Next?</h4>
            <ul style="color: #333; line-height: 1.8; padding-left: 20px;">
              <li>Complete your profile</li>
              <li>Browse available scholarships</li>
              <li>Apply to partner universities</li>
              <li>Schedule your interview</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 Azadi Global. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email error:', error.response?.body || error.message);
    return { success: false, error: error.message };
  }
}

// ========== SEND PAYMENT CONFIRMATION ==========
async function sendPaymentConfirmation(to, fullName, amount) {
  const msg = {
    to: to,
    from: FROM_EMAIL,
    subject: 'Payment Confirmation - Azadi Global',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 10px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #00375c;">Azadi Global</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #00375c;">Payment Confirmed ✅</h2>
          <p style="color: #333; line-height: 1.6;">Dear ${fullName || 'Scholar'},</p>
          <p style="color: #333; line-height: 1.6;">Your payment of <strong>$${amount}</strong> has been successfully processed.</p>
          
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #2e7d32; margin: 0;">🎉 Your application is now being processed!</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 Azadi Global. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Payment confirmation sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email error:', error.response?.body || error.message);
    return { success: false, error: error.message };
  }
}

// ========== SEND GENERIC EMAIL ==========
async function sendEmail({ to, subject, html }) {
  const msg = {
    to: to,
    from: FROM_EMAIL,
    subject: subject || 'Message from Azadi Global',
    html: html || '<p>Message from Azadi Global</p>'
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email error:', error.response?.body || error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPaymentConfirmation,
  sendEmail
};
