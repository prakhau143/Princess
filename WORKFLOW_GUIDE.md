# 🔄 Complete Ecommerce Workflow Guide

## 📋 **Step-by-Step Customer Journey:**

### 1. **Customer Login (Email OTP)**
- Customer visits: `http://localhost:3002`
- Enters email address
- Clicks "Send OTP"
- Receives OTP via email
- Enters OTP in the form
- Gets verified and session created

### 2. **Customer Details Form**
- After OTP verification → Redirects to `form.html`
- Customer fills:
  - Full Name
  - Phone Number (10-digit Indian)
  - Street Address
  - City, State, PIN Code
- Submits form → Data saved to database

### 3. **Shopping Experience**
- After form submission → Redirects to `products.html`
- Customer browses products
- Adds items to cart
- Views cart with totals

### 4. **Checkout & Order**
- Customer clicks "Checkout"
- Reviews order details
- Confirms customer information
- Places order

### 5. **Email Notifications**
- **Customer**: Gets order confirmation email
- **Owner**: Gets detailed order notification at `princess.jewellery015@gmail.com`

## 🛠️ **Current Issues to Fix:**

### Issue 1: Gmail Authentication
```env
# In .env file, update this line:
GMAIL_APP_PASSWORD=your-correct-16-character-password
```

### Issue 2: Server Response
The server is returning HTML instead of JSON, indicating an authentication error.

## 🧪 **Test Steps:**

1. **Fix Gmail Password**:
   - Get new app password from Google
   - Update `.env` file
   - Restart server: `node server.js`

2. **Test OTP**:
   - Visit: `http://localhost:3002`
   - Enter email
   - Check console for errors
   - Check email for OTP

3. **Complete Flow**:
   - Verify OTP
   - Fill customer form
   - Browse products
   - Place order
   - Check owner email

## 🔧 **Quick Fix Commands:**

```bash
# 1. Stop server
Ctrl+C

# 2. Update .env with correct password
# Edit the GMAIL_APP_PASSWORD line

# 3. Restart server
node server.js

# 4. Test at http://localhost:3002
```

## 📧 **Gmail Setup Reminder:**

1. Enable 2-Factor Authentication
2. Go to App Passwords
3. Select "Mail" → Generate
4. Copy 16-character password (like: `abcdefghijklmnop`)
5. Use this exact password in .env file
