const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('./'));
// env 
require('dotenv').config();
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

// Store OTPs (in production, use a proper database)
const otpStore = new Map();

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        // Validate phone number (Indian format)
        if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
            return res.status(400).json({ error: 'Invalid Indian phone number' });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with expiry (5 minutes)
        otpStore.set(phoneNumber, {
            otp,
            expiry: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });

        // Send SMS using Fast2SMS
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV3', {
            route: FAST2SMS_ROUTE,
            message: `Your HiKraze verification code is: ${otp}. Valid for 5 minutes.`,
            numbers: phoneNumber,
            flash: 0
        }, {
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.return === true) {
            console.log('SMS sent successfully');
            res.json({ success: true, message: 'OTP sent successfully' });
        } else {
            throw new Error('Failed to send SMS');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ 
            error: 'Failed to send OTP',
            details: error.message
        });
    }
});

// Verify OTP endpoint
app.post('/api/verify-otp', (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        // Validate input
        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate phone number format
        if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
            return res.status(400).json({ error: 'Invalid Indian phone number' });
        }

        // Get stored OTP data
        const storedData = otpStore.get(phoneNumber);

        if (!storedData) {
            return res.status(400).json({ error: 'No OTP found for this number' });
        }

        // Check if OTP has expired
        if (Date.now() > storedData.expiry) {
            otpStore.delete(phoneNumber);
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // Check if maximum attempts reached
        if (storedData.attempts >= 3) {
            otpStore.delete(phoneNumber);
            return res.status(400).json({ error: 'Maximum attempts reached. Please request a new OTP.' });
        }

        // Verify OTP
        if (otp === storedData.otp) {
            otpStore.delete(phoneNumber);
            return res.json({ 
                success: true, 
                message: 'OTP verified successfully',
                phoneNumber: phoneNumber
            });
        } else {
            // Increment attempts
            storedData.attempts++;
            otpStore.set(phoneNumber, storedData);
            
            return res.status(400).json({ 
                error: 'Invalid OTP',
                attemptsRemaining: 3 - storedData.attempts
            });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ 
            error: 'Failed to verify OTP',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
