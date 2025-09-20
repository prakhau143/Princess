const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3002', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501', 'http://127.0.0.1:5502'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('./'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// OTP rate limiting (more restrictive)
const otpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3 // limit each IP to 3 OTP requests per minute
});

// Initialize SQLite database
const db = new sqlite3.Database('./ecommerce.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    console.log('🗄️ Initializing database tables...');
    
    // Customers table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating customers table:', err);
        } else {
            console.log('✅ Customers table ready');
        }
    });

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        products TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating orders table:', err);
        } else {
            console.log('✅ Orders table ready');
        }
    });

    // OTP sessions table
    db.run(`CREATE TABLE IF NOT EXISTS otp_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating otp_sessions table:', err);
        } else {
            console.log('✅ OTP sessions table ready');
        }
    });
}

// Configure Gmail SMTP transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// Store for temporary sessions
const sessionStore = new Map();

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate session token
function generateSessionToken() {
    return jwt.sign({ timestamp: Date.now() }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });
}

// Send OTP via email
app.post('/api/send-otp', otpLimiter, [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const { email } = req.body;
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Clear any existing OTP for this email
        db.run('DELETE FROM otp_sessions WHERE email = ?', [email]);

        // Store OTP in database
        db.run('INSERT INTO otp_sessions (email, otp, expires_at) VALUES (?, ?, ?)', 
            [email, otp, expiresAt.toISOString()]);

        // Send email
        const mailOptions = {
            from: `"${process.env.STORE_NAME || 'HiKraze'}" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Your Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Verification Code</h2>
                    <p>Your verification code is:</p>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #666;">This code will expire in 5 minutes.</p>
                    <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
                </div>
            `
        };

        const emailResult = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully:', emailResult.messageId);
        
        res.json({ 
            success: true, 
            message: 'OTP sent successfully to your email',
            messageId: emailResult.messageId
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ 
            error: 'Failed to send OTP',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Verify OTP
app.post('/api/verify-otp', [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        const { email, otp } = req.body;

        // Get OTP from database
        db.get('SELECT * FROM otp_sessions WHERE email = ? AND verified = FALSE ORDER BY created_at DESC LIMIT 1', 
            [email], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!row) {
                return res.status(400).json({ error: 'No OTP found for this email' });
            }

            // Check if OTP has expired
            if (new Date() > new Date(row.expires_at)) {
                db.run('DELETE FROM otp_sessions WHERE id = ?', [row.id]);
                return res.status(400).json({ error: 'OTP has expired' });
            }

            // Check attempts
            if (row.attempts >= 3) {
                db.run('DELETE FROM otp_sessions WHERE id = ?', [row.id]);
                return res.status(400).json({ error: 'Maximum attempts reached. Please request a new OTP.' });
            }

            // Verify OTP
            if (otp === row.otp) {
                // Mark as verified
                db.run('UPDATE otp_sessions SET verified = TRUE WHERE id = ?', [row.id]);
                
                // Generate session token
                const sessionToken = generateSessionToken();
                sessionStore.set(sessionToken, { email, verified: true, timestamp: Date.now() });

                res.json({ 
                    success: true, 
                    message: 'OTP verified successfully',
                    sessionToken: sessionToken,
                    email: email
                });
            } else {
                // Increment attempts
                db.run('UPDATE otp_sessions SET attempts = attempts + 1 WHERE id = ?', [row.id]);
                
                res.status(400).json({ 
                    error: 'Invalid OTP',
                    attemptsRemaining: 3 - (row.attempts + 1)
                });
            }
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ 
            error: 'Failed to verify OTP',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Middleware to verify session
function verifySession(req, res, next) {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken || !sessionStore.has(sessionToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = sessionStore.get(sessionToken);
    if (Date.now() - session.timestamp > 3600000) { // 1 hour
        sessionStore.delete(sessionToken);
        return res.status(401).json({ error: 'Session expired' });
    }

    req.userEmail = session.email;
    next();
}

// Save customer details
app.post('/api/customer-details', verifySession, [
    body('name').trim().isLength({ min: 2 }),
    body('phone').isMobilePhone(),
    body('address').trim().isLength({ min: 5 }),
    body('city').trim().isLength({ min: 2 }),
    body('state').trim().isLength({ min: 2 }),
    body('pincode').isPostalCode('IN')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid customer details', details: errors.array() });
        }

        const { name, phone, address, city, state, pincode } = req.body;
        const email = req.userEmail;

        // Insert or update customer
        db.run(`INSERT OR REPLACE INTO customers (email, name, phone, address, city, state, pincode) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [email, name, phone, address, city, state, pincode], 
            async function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to save customer details' });
                }

                // Send email notification to store owner about new customer registration
                try {
                    const customerNotificationEmail = {
                        from: `"${process.env.STORE_NAME}" <${process.env.GMAIL_USER}>`,
                        to: process.env.OWNER_EMAIL,
                        subject: `🆕 New Customer Registration - ${name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                    <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">🆕 New Customer Registration</h2>
                                    
                                    <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                        <h3 style="color: #27ae60; margin-top: 0;">Customer Details:</h3>
                                        <table style="width: 100%; border-collapse: collapse;">
                                            <tr><td style="padding: 8px 0; font-weight: bold;">Name:</td><td style="padding: 8px 0;">${name}</td></tr>
                                            <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td style="padding: 8px 0;">${email}</td></tr>
                                            <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td style="padding: 8px 0;">${phone}</td></tr>
                                            <tr><td style="padding: 8px 0; font-weight: bold;">Address:</td><td style="padding: 8px 0;">${address}</td></tr>
                                            <tr><td style="padding: 8px 0; font-weight: bold;">City:</td><td style="padding: 8px 0;">${city}, ${state}</td></tr>
                                            <tr><td style="padding: 8px 0; font-weight: bold;">PIN Code:</td><td style="padding: 8px 0;">${pincode}</td></tr>
                                        </table>
                                    </div>
                                    
                                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                        <p style="margin: 0; color: #856404;">
                                            <strong>📝 Note:</strong> This customer has completed their profile and is now ready to place orders on your website.
                                        </p>
                                    </div>
                                    
                                    <div style="text-align: center; margin-top: 30px;">
                                        <p style="color: #7f8c8d; font-size: 14px;">
                                            Registration Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                        </p>
                                        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
                                            This is an automated notification from ${process.env.STORE_NAME}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `
                    };

                    await transporter.sendMail(customerNotificationEmail);
                    console.log('📧 Customer registration notification sent to owner');
                } catch (emailError) {
                    console.error('Failed to send customer notification email:', emailError);
                    // Don't fail the request if email fails
                }

                res.json({ 
                    success: true, 
                    message: 'Customer details saved successfully',
                    customerId: this.lastID
                });
            });

    } catch (error) {
        console.error('Error saving customer details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Place order and send notification email to owner
app.post('/api/place-order', verifySession, [
    body('products').isArray({ min: 1 }),
    body('totalAmount').isFloat({ min: 0 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid order data' });
        }

        const { products, totalAmount } = req.body;
        const email = req.userEmail;

        // Get customer details
        db.get('SELECT * FROM customers WHERE email = ?', [email], async (err, customer) => {
            if (err || !customer) {
                return res.status(400).json({ error: 'Customer not found. Please fill your details first.' });
            }

            // Save order to database
            db.run('INSERT INTO orders (customer_id, products, total_amount) VALUES (?, ?, ?)', 
                [customer.id, JSON.stringify(products), totalAmount], 
                async function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to place order' });
                    }

                    const orderId = this.lastID;

                    // Send order notification email to owner
                    try {
                        const orderEmailHtml = `
                            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                                    🛍️ New Order Received - #${orderId}
                                </h2>
                                
                                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                                    <h3 style="color: #007bff; margin-top: 0;">Customer Details:</h3>
                                    <p><strong>Name:</strong> ${customer.name}</p>
                                    <p><strong>Email:</strong> ${customer.email}</p>
                                    <p><strong>Phone:</strong> ${customer.phone}</p>
                                    <p><strong>Address:</strong> ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}</p>
                                </div>

                                <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 5px; margin: 20px 0;">
                                    <h3 style="color: #007bff; margin: 0; padding: 15px; background: #e9ecef; border-bottom: 1px solid #dee2e6;">
                                        Order Items:
                                    </h3>
                                    <div style="padding: 15px;">
                                        ${products.map(product => `
                                            <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between;">
                                                <div>
                                                    <strong>${product.name}</strong><br>
                                                    <small style="color: #666;">Quantity: ${product.quantity}</small>
                                                </div>
                                                <div style="text-align: right;">
                                                    <strong>${product.price}</strong>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                <div style="background: #28a745; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                                    <h3 style="margin: 0;">Total Amount: ₹${totalAmount}</h3>
                                </div>

                                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                    <p style="margin: 0; color: #856404;">
                                        <strong>⏰ Order placed on:</strong> ${new Date().toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        `;

                        const ownerMailOptions = {
                            from: `"${process.env.STORE_NAME || 'HiKraze'}" <${process.env.GMAIL_USER}>`,
                            to: process.env.OWNER_EMAIL || process.env.GMAIL_USER,
                            subject: `🛍️ New Order #${orderId} - ₹${totalAmount}`,
                            html: orderEmailHtml
                        };

                        await transporter.sendMail(ownerMailOptions);

                        // Send confirmation email to customer
                        const customerEmailHtml = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #28a745;">✅ Order Confirmed!</h2>
                                <p>Dear ${customer.name},</p>
                                <p>Thank you for your order! We have received your order and will process it soon.</p>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                    <p><strong>Order ID:</strong> #${orderId}</p>
                                    <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
                                    <p><strong>Order Date:</strong> ${new Date().toLocaleString('en-IN')}</p>
                                </div>
                                <p>We will contact you soon with shipping details.</p>
                                <p>Thank you for shopping with us!</p>
                            </div>
                        `;

                        const customerMailOptions = {
                            from: `"${process.env.STORE_NAME || 'HiKraze'}" <${process.env.GMAIL_USER}>`,
                            to: customer.email,
                            subject: `Order Confirmation #${orderId}`,
                            html: customerEmailHtml
                        };

                        await transporter.sendMail(customerMailOptions);

                        res.json({ 
                            success: true, 
                            message: 'Order placed successfully! Confirmation emails sent.',
                            orderId: orderId
                        });

                    } catch (emailError) {
                        console.error('Error sending emails:', emailError);
                        res.json({ 
                            success: true, 
                            message: 'Order placed successfully, but there was an issue sending notification emails.',
                            orderId: orderId
                        });
                    }
                });
        });

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get products endpoint
app.get('/api/products', (req, res) => {
    try {
        const fs = require('fs');
        const products = JSON.parse(fs.readFileSync('./json/products.json', 'utf8'));
        res.json(products);
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).json({ error: 'Failed to load products' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'HiKraze Ecommerce API'
    });
});

// Serve login page as default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📧 Email service configured with: ${process.env.GMAIL_USER}`);
    console.log(`🛍️ Store name: ${process.env.STORE_NAME || 'HiKraze'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
