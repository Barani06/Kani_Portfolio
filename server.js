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
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
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



/* ─── Contact Route ───────────────────────────────────── */
app.post('/api/contact', contactLimiter, async (req, res) => {

  const { name, email, phone, message } = req.body;

  try {

    // Email to you
    await resend.emails.send({
      from: 'Digital Rise <onboarding@resend.dev>',
      to: process.env.OWNER_EMAIL,
      subject: `New Enquiry from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    });

    // Auto reply
    await resend.emails.send({
      from: 'Digital Rise <onboarding@resend.dev>',
      to: email,
      subject: 'Thank you for contacting Digital Rise Marketing',
      html: `
        <h2>Thank You!</h2>

        <p>Hi ${name},</p>

        <p>
          We have received your enquiry and will get back to you
          within 24–48 hours.
        </p>

        <p>
          Regards,<br>
          Digital Rise Marketing
        </p>
      `
    });

    return res.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});/* ─── Health Check ────────────────────────────────────── */
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
