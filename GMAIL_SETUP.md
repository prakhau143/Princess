# 📧 Gmail SMTP Setup Instructions

## 🔑 Get Your Gmail App Password

Since you're using `princess.jewellery015@gmail.com`, follow these steps:

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on **Security** (left sidebar)
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the setup if not already enabled

### Step 2: Generate App Password
1. In the same Security section, click **App passwords**
2. Select **Mail** from the dropdown
3. Click **Generate**
4. Copy the **16-character password** (like: `abcd efgh ijkl mnop`)

### Step 3: Update .env File
Open the `.env` file and replace:
```
GMAIL_APP_PASSWORD=your-app-password-here
```

With your actual app password:
```
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

## ⚠️ Important Notes:
- Use the **App Password**, NOT your regular Gmail password
- The app password is 16 characters without spaces
- Keep this password secure and don't share it

## 🧪 Test Configuration
After updating the .env file, run:
```bash
npm start
```

The server should start without errors and show:
```
🚀 Server is running on port 3000
📧 Email service configured with: princess.jewellery015@gmail.com
🛍️ Store name: HiKraze
```

## 🔍 Troubleshooting
If you get authentication errors:
1. Double-check the app password is correct
2. Ensure 2-factor authentication is enabled
3. Make sure you're using the app password, not regular password
