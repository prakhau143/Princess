# 🛍️ HiKraze - SMTP-Based Ecommerce Website

A complete ecommerce solution with **email OTP authentication**, **customer management**, and **automated order notifications** using Google SMTP.

## ✨ Features

### 🔐 Authentication System
- **Email OTP Verification** using Google SMTP (no Firebase required)
- Secure session management with JWT tokens
- Rate limiting for security

### 👤 Customer Management
- Complete customer profile collection
- Indian address format with PIN code validation
- SQLite database for data persistence

### 🛒 Shopping Experience
- Product catalog with categories
- Shopping cart functionality
- Order placement with email notifications

### 📧 Email Notifications
- **Customer OTP emails** for authentication
- **Order confirmation emails** to customers
- **Order notification emails** to store owner
- Beautiful HTML email templates

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Gmail account with 2-factor authentication enabled

### 1. Clone & Install
```bash
git clone <repository-url>
cd Ecommerce-website-main-main
npm install
```

### 2. Gmail SMTP Setup
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Copy the 16-character password

### 3. Environment Configuration
```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` file:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Store Configuration
STORE_NAME=HiKraze
OWNER_EMAIL=owner@yourstore.com

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Visit: `http://localhost:3000`

## 📋 Complete Workflow

### 1. Customer Login (OTP)
- Customer enters email address
- OTP sent via Gmail SMTP
- Email verification creates user session

### 2. Customer Profile
- Customer fills detailed form:
  - Full Name
  - Phone Number (Indian format)
  - Complete Address (Street, City, State, PIN)
- Data stored in SQLite database

### 3. Shopping & Cart
- Browse products by category
- Add items to cart
- View cart with totals

### 4. Order Placement
- Review order details
- Confirm customer information
- Place order

### 5. Email Notifications
- **Customer**: Order confirmation email
- **Owner**: Detailed order notification with customer details

## 🗂️ Project Structure

```
├── server.js              # Main server with SMTP & API endpoints
├── package.json           # Dependencies & scripts
├── .env.example          # Environment template
├── ecommerce.db          # SQLite database (auto-created)
│
├── HTML Files
│   ├── index.html        # Homepage
│   ├── login.html        # Email OTP login
│   ├── form.html         # Customer details form
│   ├── products.html     # Product catalog
│   └── checkout.html     # Order review & placement
│
├── JavaScript/
│   ├── smtp-otp.js       # Email OTP authentication
│   ├── form.js           # Customer details form handler
│   ├── cart.js           # Shopping cart & order placement
│   └── checkout.js       # Checkout process
│
├── Style/                # CSS files
├── images/               # Product images
└── json/
    └── products.json     # Product catalog
```

## 🔧 API Endpoints

### Authentication
- `POST /api/send-otp` - Send OTP to email
- `POST /api/verify-otp` - Verify OTP & create session

### Customer Management
- `POST /api/customer-details` - Save customer information

### Orders
- `POST /api/place-order` - Place order & send notifications

### Utilities
- `GET /api/products` - Get product catalog
- `GET /api/health` - Health check

## 📧 Email Templates

### OTP Email
- Clean, professional design
- 6-digit verification code
- 5-minute expiry notice

### Order Confirmation (Customer)
- Order details summary
- Customer information
- Thank you message

### Order Notification (Owner)
- Complete customer details
- Itemized product list
- Total amount & order ID
- Timestamp

## 🛡️ Security Features

- **Rate Limiting**: Prevents spam and abuse
- **Input Validation**: Server-side validation for all inputs
- **Session Management**: JWT-based secure sessions
- **CORS Protection**: Configured for security
- **Helmet.js**: Security headers

## 🎨 UI/UX Features

- **Responsive Design**: Works on all devices
- **Modern Interface**: Clean, professional styling
- **Loading States**: Visual feedback for all actions
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time validation with helpful messages

## 🔍 Database Schema

### Customers Table
```sql
- id (INTEGER PRIMARY KEY)
- email (TEXT UNIQUE)
- name, phone, address, city, state, pincode
- created_at (DATETIME)
```

### Orders Table
```sql
- id (INTEGER PRIMARY KEY)
- customer_id (FOREIGN KEY)
- products (JSON)
- total_amount (REAL)
- status, created_at
```

### OTP Sessions Table
```sql
- id (INTEGER PRIMARY KEY)
- email, otp, expires_at
- attempts, verified
- created_at
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure proper `OWNER_EMAIL`

## 🛠️ Customization

### Adding Products
Edit `json/products.json`:
```json
{
  "id": 34,
  "name": "New Product",
  "price": "$99.00",
  "images": ["images/path/to/image.jpg"],
  "category": "Category",
  "description": "Product description"
}
```

### Email Templates
Modify email HTML in `server.js`:
- Search for `orderEmailHtml` (owner notification)
- Search for `customerEmailHtml` (customer confirmation)

### Styling
- Main styles: `Style/main.css`
- Login styles: `Style/login.css`
- Form styles: `Style/form.css`

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify `.env` configuration
3. Ensure Gmail App Password is correct
4. Check network connectivity

## 🎯 Key Benefits

✅ **No Firebase Required** - Pure SMTP solution  
✅ **Complete Customer Data** - Full address collection  
✅ **Automated Emails** - Owner gets instant order notifications  
✅ **Secure Authentication** - Email OTP with rate limiting  
✅ **Mobile Responsive** - Works perfectly on all devices  
✅ **Easy Setup** - Just configure Gmail and run  

---

**Built with ❤️ for modern ecommerce needs**
