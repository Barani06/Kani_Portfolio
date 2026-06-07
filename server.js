/**
 * DigitalRise Marketing Portfolio — Node.js / Express Backend
 * Handles: contact form submission, static file serving
 *
 * Setup:
 *   npm install express nodemailer cors dotenv helmet express-rate-limit
 *   node server.js
 */

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
/* ─── Security Middleware ─────────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* ─── Rate Limiting ───────────────────────────────────── */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // max 5 submissions per window
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ─── Serve Static Files ──────────────────────────────── */
app.use(express.static(path.join(__dirname)));

/* ─── Input Validator ─────────────────────────────────── */
function validateContactInput({ name, email, phone, message }) {
  const errors = [];
  if (!name || name.trim().length < 2)
    errors.push('Name must be at least 2 characters.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('Please provide a valid email address.');
  if (!phone || !/^\+?[\d\s\-().]{7,20}$/.test(phone))
    errors.push('Please provide a valid phone number.');
  if (message && message.length > 2000)
    errors.push('Message must be under 2000 characters.');
  return errors;
}

/* ─── Mailer Setup ────────────────────────────────────── */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/* ─── Contact Route ───────────────────────────────────── */
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Validate
  const errors = validateContactInput({ name, email, phone, message });
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Sanitize
  const safeName    = name.trim().slice(0, 100);
  const safeEmail   = email.trim().slice(0, 200);
  const safePhone   = phone.trim().slice(0, 30);
  const safeMessage = (message || '').trim().slice(0, 2000);

  try {
    const transporter = createTransporter();

    // Email to owner
    const ownerMail = {
      from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
      to: process.env.OWNER_EMAIL || process.env.SMTP_USER,
      replyTo: safeEmail,
      subject: `New Enquiry from ${safeName} — DigitalRise Marketing Portfolio`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f0eb;padding:40px 32px;border:1px solid rgba(201,169,110,0.2);">
          <h2 style="font-size:1.6rem;font-weight:300;color:#c9a96e;margin:0 0 24px 0;">New Portfolio Enquiry</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid rgba(201,169,110,0.1);color:#888;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;width:100px;">Name</td>
                <td style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(201,169,110,0.1);">${safeName}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid rgba(201,169,110,0.1);color:#888;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;">Email</td>
                <td style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(201,169,110,0.1);"><a href="mailto:${safeEmail}" style="color:#c9a96e;">${safeEmail}</a></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid rgba(201,169,110,0.1);color:#888;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;">Phone</td>
                <td style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(201,169,110,0.1);">${safePhone}</td></tr>
            ${safeMessage ? `
            <tr><td style="padding:10px 0;color:#888;font-size:0.78rem;letter-spacing:0.1em;text-transform:uppercase;vertical-align:top;">Message</td>
                <td style="padding:10px 0 10px 16px;line-height:1.7;">${safeMessage.replace(/\n/g, '<br>')}</td></tr>` : ''}
          </table>
          <p style="margin-top:32px;font-size:0.78rem;color:#555;">Sent from DigitalRise Marketing Portfolio contact form</p>
        </div>
      `,
    };

    // Auto-reply to sender
    const autoReply = {
      from: `"Kanimozhi Ramu | DigitalRise Marketing" <${process.env.SMTP_USER}>`,
      to: safeEmail,
      subject: `Thanks for reaching out, ${safeName.split(' ')[0]}! — DigitalRise Marketing`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f0eb;padding:40px 32px;border:1px solid rgba(201,169,110,0.2);">
          <h2 style="font-size:1.6rem;font-weight:300;color:#c9a96e;margin:0 0 24px 0;">Thank you for your enquiry!</h2>
          <p style="line-height:1.8;color:rgba(245,240,235,0.75);">
            Hi ${safeName.split(' ')[0]},<br /><br />
            Thank you for reaching out! I've received your message and will get back to you within
            <strong style="color:#c9a96e;">24–48 hours</strong>.<br /><br />
            Looking forward to discussing how I can help grow your business online.
          </p>
          <hr style="border:none;border-top:1px solid rgba(201,169,110,0.2);margin:28px 0;" />
          <p style="font-size:0.82rem;color:#888;line-height:1.7;">
            <strong style="color:#c9a96e;">DigitalRise Marketing</strong><br />
            Best Digital Marketing Agency in Chennai<br />
            SEO · SEM · SMM · Content Creation · Graphic Design
          </p>
        </div>
      `,
    };

    await transporter.sendMail(ownerMail);
    await transporter.sendMail(autoReply);

    console.log(`[Contact] New enquiry from ${safeName} <${safeEmail}>`);
    return res.json({ success: true, message: 'Your message has been sent successfully!' });

  } catch (err) {
    console.error('[Contact Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
  }
});

/* ─── Health Check ────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ─── Catch-all → SPA ─────────────────────────────────── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ─── Error Handler ───────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ─── Start ───────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀 DigitalRise Marketing Portfolio running at http://localhost:${PORT}\n`);
});

module.exports = app;
