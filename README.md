# Helna Fenza Portfolio

> Best Digital Marketing Freelancer in Calicut | SEO, SEM & SMM Portfolio

## Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML5, CSS3 (custom — no framework), Vanilla JS |
| Backend | Node.js 18+ · Express 4 |
| Email | Nodemailer (SMTP) |
| Security | Helmet · CORS · express-rate-limit |

---

## Project Structure

```
portfolio/
├── index.html          # Full single-page portfolio (all CSS + JS inline)
├── server.js           # Express backend (static serving + contact API)
├── package.json
├── .env.example        # Copy to .env and fill in credentials
└── README.md
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your SMTP credentials

# 3. Start the server
npm start          # production
npm run dev        # development (nodemon auto-reload)
```

Open `http://localhost:3000` in your browser.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Port to listen on (default: 3000) |
| `ALLOWED_ORIGIN` | CORS allowed origin |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | Use TLS (`true`/`false`) |
| `SMTP_USER` | SMTP username / email |
| `SMTP_PASS` | SMTP password / app password |
| `OWNER_EMAIL` | Where to send enquiry notifications |

---

## API

### `POST /api/contact`

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "message": "I'd like to discuss SEO services."
}
```

**Success response:**
```json
{ "success": true, "message": "Your message has been sent successfully!" }
```

**Rate limit:** 5 submissions per 15 minutes per IP.

---

## Deployment

### Shared Hosting / cPanel
1. Upload all files
2. Set up Node.js app in cPanel → Node.js Selector
3. Set environment variables in cPanel or `.env`
4. Set the startup file to `server.js`

### VPS / Cloud (e.g. DigitalOcean, Render, Railway)
```bash
# With PM2
npm install -g pm2
pm2 start server.js --name helnafenza
pm2 save
pm2 startup
```

### Vercel / Netlify (static only)
For purely static deployment (no contact form backend),
serve `index.html` and replace the fetch call to `/api/contact`
with a third-party form service like Formspree or EmailJS.

---

## Sections

1. **Hero** — Name, tagline, CTA buttons
2. **About** — Bio, skills overview
3. **Services** — 6 service cards (SEO, SEM, SMM, Social Handling, Content, Graphic Design)
4. **Stats** — 7+ Websites · 100+ Clients · 80% Traffic Improved
5. **Career Achievements** — Google SERP ranking screenshots
6. **Results Delivered** — Portfolio result images
7. **Client Testimonials** — Auto-advancing slider with 3 testimonials
8. **Why Choose Me** — Value proposition
9. **Skills** — Animated progress bars (SEO 95%, SEM 90%, SMM 88%, Design 85%)
10. **FAQ** — Accordion
11. **Contact** — Form → POST /api/contact → Nodemailer
