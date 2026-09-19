// ============================================================
// AZADI EMAIL SERVICE - AWS SES
// ============================================================
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@azadiunfoldurmyth.com';
const FROM_NAME = 'Azadi Global';

const verificationCodes = new Map();

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, name) {
    const code = generateCode();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    verificationCodes.set(email, { code, expiresAt });

    const htmlBody = getVerificationEmailHTML(name || email.split('@')[0], code);

    const command = new SendEmailCommand({
        Source: '"' + FROM_NAME + '" <' + FROM_EMAIL + '>',
        Destination: { ToAddresses: [email] },
        Message: {
            Subject: { Data: 'Azadi Verification Code', Charset: 'UTF-8' },
            Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } }
        }
    });

    await sesClient.send(command);
    console.log('Email sent to ' + email + ', code: ' + code);
    return code;
}

function verifyCode(email, code) {
    const stored = verificationCodes.get(email);
    if (!stored) return { valid: false, error: 'No verification code found' };
    if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(email);
        return { valid: false, error: 'Code expired' };
    }
    if (stored.code !== code) return { valid: false, error: 'Invalid code' };
    return { valid: true };
}

function getVerificationEmailHTML(name, code) {
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
    '<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">' +
    '<div style="max-width:600px;margin:0 auto;background:white;padding:40px;border-radius:10px;">' +
    '<div style="text-align:center;margin-bottom:30px;">' +
    '<h1 style="color:#00375c;font-size:22px;">Azadi Cross-Border Academic Legacy</h1>' +
    '<h2 style="color:#00375c;">Email Verification</h2>' +
    '</div>' +
    '<p>Dear ' + name + ',</p>' +
    '<p>Thank you for joining Azadi Global! Please use the verification code below to complete your registration.</p>' +
    '<div style="background:#e5f4ff;padding:30px;border-radius:10px;text-align:center;margin:30px 0;">' +
    '<p style="color:#00375c;font-size:14px;margin:0 0 10px;">YOUR VERIFICATION CODE</p>' +
    '<div style="font-size:42px;font-weight:bold;color:#00375c;letter-spacing:8px;font-family:monospace;">' + code + '</div>' +
    '<p style="color:#666;font-size:12px;margin:15px 0 0;">This code expires in 15 minutes</p>' +
    '</div>' +
    '<p style="font-size:14px;color:#666;">Security Notice: Do not share this code with anyone. If you did not make this request, please ignore this email.</p>' +
    '<p style="font-style:italic;text-align:center;color:#00375c;">"Unfold your myth - cross borders - build your legacy."</p>' +
    '<div style="text-align:center;color:#666;font-size:12px;margin-top:30px;padding-top:20px;border-top:1px solid #eee;">' +
    '<p>The Azadi Global Team</p>' +
    '<p>All rights reserved - Azadi Cross-border academic legacy.</p>' +
    '</div></div></body></html>';
}

async function sendInterviewConfirmationEmail(data) {
    const body = `Hello & Salaam

Your interview for the Azadi — Cross-Border Academic Legacy platform has been confirmed.

Date: ${data.date}
Time: ${data.time}
Type: ${data.type}

Join your Zoom interview here:
https://zoom.us/j/5847637329

⚠️ Before your interview, please have ready:

1. A government-issued ID card (Tazkira or passport) — you will need to show it during the interview to verify your identity and nationality.
2. You must currently be residing in your home country at the time of application. Please be prepared to confirm this.

Please save this Zoom link — you'll use it at your scheduled time. Make sure your audio and video are working before joining.

If you need to reschedule, please reply to this email.

Warm regards,
from Azadi's leading team
Azadi — Cross-Border Academic Legacy`;

    const command = new SendEmailCommand({
        Source: `Azadi — Cross-Border Academic Legacy <${FROM_EMAIL}>`,
        ReplyToAddresses: ['unfoldyourmyth.mushahed.0023@gmail.com'],
        Destination: { ToAddresses: [data.userEmail] },
        Message: {
            Subject: { Data: 'Your Azadi Interview is Confirmed' },
            Body: { Text: { Data: body } }
        }
    });
    await sesClient.send(command);
}

module.exports = { sendVerificationEmail, verifyCode, sendInterviewConfirmationEmail };
