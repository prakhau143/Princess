# Princess Jewellery - Production Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Environment Setup
- Use `production.env` for production deployment
- Ensure all environment variables are properly configured
- Verify Gmail SMTP credentials are working

### 2. Domain Configuration
- **Production Domain**: https://princessjewellery.in
- CORS is configured for both www and non-www versions
- API endpoints will automatically detect production environment

### 3. SMTP OTP Configuration
The application includes a robust SMTP-based OTP system:

#### Gmail Setup Required:
1. Enable 2-Factor Authentication on Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `GMAIL_USER` and `GMAIL_APP_PASSWORD` in production.env

#### Current Configuration:
- **Email**: princess.jewellery015@gmail.com
- **App Password**: Configured in production.env
- **Store Name**: Princess Jewellery

### 4. Server Commands

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production mode (recommended for deployment)
npm run start:prod

# Alternative production start
NODE_ENV=production node server.js
```

### 5. Deployment Verification

Run the deployment checker:
```bash
node deploy.js
```

This will verify:
- ✅ Environment variables
- ✅ Required files
- ✅ Database setup
- ✅ Static assets

### 6. Production Features

#### Security:
- Helmet middleware with CSP
- Rate limiting (100 requests/15min)
- OTP rate limiting (3 attempts/minute)
- JWT session management
- Input validation and sanitization

#### Email System:
- OTP verification emails
- Order confirmation emails
- Customer registration notifications
- Owner order notifications

#### API Endpoints:
- `POST /api/send-otp` - Send OTP to email
- `POST /api/verify-otp` - Verify OTP and create session
- `GET /api/products` - Fetch products
- `POST /api/orders` - Place order (requires session)
- `POST /api/customers` - Register customer (requires session)

### 7. Environment Variables Reference

```env
# Server
PORT=3000
NODE_ENV=production
DOMAIN=https://princessjewellery.in

# Gmail SMTP
GMAIL_USER=princess.jewellery015@gmail.com
GMAIL_APP_PASSWORD=your-app-password-here

# Store
STORE_NAME=Princess Jewellery
OWNER_EMAIL=princess.jewellery015@gmail.com

# Security
JWT_SECRET=secure-random-string-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
OTP_RATE_LIMIT_WINDOW_MS=60000
OTP_RATE_LIMIT_MAX_REQUESTS=3
```

### 8. Troubleshooting

#### SMTP Issues:
- Verify Gmail 2FA is enabled
- Check app password is correct
- Ensure no special characters in credentials
- Check server logs for SMTP connection status

#### API Issues:
- Verify CORS settings for your domain
- Check API base URL in JavaScript files
- Ensure all static files are accessible

#### Database Issues:
- SQLite database will be created automatically
- Ensure write permissions in deployment directory
- Check database initialization logs

### 9. Production Monitoring

Monitor these logs on startup:
- ✅ SMTP server connection
- ✅ Database initialization
- ✅ Server listening on port
- ✅ Environment configuration

### 10. File Structure for Deployment

```
Princess/
├── server.js              # Main server file
├── package.json           # Dependencies
├── production.env         # Production environment
├── deploy.js             # Deployment checker
├── index.html            # Homepage
├── products.html         # Products page
├── cartPage.html         # Cart page
├── checkout.html         # Checkout page
├── JavaScript/           # Client-side scripts
│   ├── smtp-otp.js      # OTP functionality
│   ├── main.js          # Main scripts
│   └── ...
├── Style/               # CSS files
├── images/              # Product images
├── json/
│   └── products.json    # Product data
└── ecommerce.db         # SQLite database (auto-created)
```

## 🎯 Ready for Production!

Your Princess Jewellery e-commerce site is configured for:
- ✅ Secure SMTP OTP authentication
- ✅ Production domain (https://princessjewellery.in)
- ✅ Robust error handling
- ✅ Security best practices
- ✅ Email notifications
- ✅ Complete product catalog

Deploy and test the OTP functionality on your live domain!
