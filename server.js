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
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });
}

/* ─── Contact Route ───────────────────────────────────── */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

  // Sanitize
  const safeName    = name.trim().slice(0, 100);
  const safeEmail   = email.trim().slice(0, 200);
  const safePhone   = phone.trim().slice(0, 30);
  const safeMessage = (message || '').trim().slice(0, 2000);

  try {

    console.log('CREATING TRANSPORTER');

    const transporter = createTransporter();

    console.log('VERIFYING SMTP CONNECTION');

    await transporter.verify();

    console.log('SMTP VERIFIED SUCCESSFULLY');

    // Email to owner
    const ownerMail = {
      from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
      to: process.env.OWNER_EMAIL || process.env.SMTP_USER,
      replyTo: safeEmail,
      subject: `New Enquiry from ${safeName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Message:</strong> ${safeMessage}</p>
      `
    };

    console.log('SENDING OWNER EMAIL');

    await transporter.sendMail(ownerMail);

    console.log('OWNER EMAIL SENT');

    // Auto Reply
    const autoReply = {
      from: `"DigitalRise Marketing" <${process.env.SMTP_USER}>`,
      to: safeEmail,
      subject: `Thank you for contacting DigitalRise Marketing`,
      html: `
        <h2>Thank You!</h2>
        <p>Hi ${safeName},</p>
        <p>We have received your enquiry and will get back to you shortly.</p>
      `
    };

    console.log('SENDING AUTO REPLY');

    await transporter.sendMail(autoReply);

    console.log('AUTO REPLY SENT');

    console.log('CONTACT FORM COMPLETED SUCCESSFULLY');

    return res.json({
      success: true,
      message: 'Your message has been sent successfully!'
    });

  } catch (err) {

    console.log('================================');
    console.log('CONTACT ROUTE FAILED');
    console.log('================================');

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
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
