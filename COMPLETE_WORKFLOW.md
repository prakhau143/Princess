# 🎉 Complete SMTP-Based Ecommerce Workflow

## 📋 **Full Customer Journey with Email Notifications**

### 1. **Customer Login (Email OTP)**
- Customer visits: `http://localhost:3002`
- Enters email address → Clicks "Send OTP"
- **📧 Email sent**: OTP verification code to customer
- Customer enters OTP → Verification successful
- **Session created**: JWT token stored

### 2. **Customer Profile Form**
- Customer redirected to `form.html`
- Fills complete details:
  - Full Name
  - Phone Number (10-digit Indian)
  - Street Address
  - City, State, PIN Code
- Clicks "Save Details & Continue Shopping"

### 3. **Form Submission & Email Notifications**
- **✅ Data saved**: Customer details stored in SQLite database
- **📧 Email sent to owner**: `princess.jewellery015@gmail.com`
  - Subject: "🆕 New Customer Registration - [Customer Name]"
  - Contains: Complete customer details, registration time
- **🏠 Redirect**: Customer redirected to home page (`index.html`)

### 4. **Shopping Experience**
- Customer browses products on home page
- Adds items to cart
- Views cart with totals and shipping calculation

### 5. **Order Placement**
- Customer proceeds to checkout
- Reviews order details and customer information
- Places order

### 6. **Order Email Notifications**
- **📧 Customer email**: Order confirmation with details
- **📧 Owner email**: Complete order notification with:
  - Customer details (name, phone, address)
  - Itemized product list
  - Total amount and order ID
  - Timestamp

## 📧 **Email Notifications Summary**

### Owner Receives 2 Types of Emails:

#### 1. **Customer Registration Email**
```
Subject: 🆕 New Customer Registration - [Name]
Content: 
- Customer details (name, email, phone, address)
- Registration timestamp
- Note that customer is ready to place orders
```

#### 2. **Order Notification Email**
```
Subject: 🛒 New Order #[OrderID] - [Customer Name]
Content:
- Complete customer details
- Itemized product list with quantities and prices
- Subtotal, shipping, and total amount
- Order timestamp
```

## 🔄 **Technical Flow**

### Backend Endpoints:
1. `POST /api/send-otp` → Sends OTP email
2. `POST /api/verify-otp` → Verifies OTP, creates session
3. `POST /api/customer-details` → Saves customer data + sends registration email
4. `POST /api/place-order` → Processes order + sends order emails

### Email Configuration:
- **SMTP**: Gmail with app password
- **From**: `princess.jewellery015@gmail.com`
- **To (Owner)**: `princess.jewellery015@gmail.com`
- **Templates**: Beautiful HTML emails with styling

### Database Tables:
- `customers` → Customer profiles
- `orders` → Order history with customer relationship
- `otp_sessions` → OTP verification tracking

## 🎯 **Key Features Implemented**

✅ **Email OTP Authentication** - No Firebase needed  
✅ **Customer Profile Collection** - Complete Indian address format  
✅ **Registration Email Notifications** - Owner gets notified of new customers  
✅ **Order Email Notifications** - Owner gets detailed order information  
✅ **Automatic Redirects** - Smooth user flow from login → profile → home → shop  
✅ **Session Management** - JWT-based secure sessions  
✅ **Input Validation** - Server-side validation for all data  
✅ **Error Handling** - Graceful error handling throughout  

## 🧪 **Test the Complete Flow**

1. **Login**: Visit `http://localhost:3002` → Enter email → Get OTP → Verify
2. **Profile**: Fill customer details → Submit
3. **Check Email**: `princess.jewellery015@gmail.com` should receive registration notification
4. **Shop**: Browse products → Add to cart → Checkout
5. **Order**: Place order → Check email for order notification

## 📬 **Email Examples**

### Registration Email to Owner:
- Customer: John Doe registered
- Email: john@example.com
- Phone: 9876543210
- Address: Complete address details
- Time: Registration timestamp

### Order Email to Owner:
- Customer: John Doe placed order #12345
- Products: List of items with quantities
- Total: ₹1,250.00
- Delivery: Customer's address
- Time: Order timestamp

---

**🎉 Your complete SMTP-based ecommerce system is now fully functional with comprehensive email notifications!**
