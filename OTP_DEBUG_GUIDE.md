# 🐛 OTP Issue Debug Guide

## 🔍 **Current Issue:**
Customer clicks "Send OTP" → Redirects back to email field instead of showing OTP input field.

## 🧪 **Debug Steps:**

### 1. **Test OTP Section Display**
- Visit: `http://localhost:3002`
- Click the **🧪 Debug: Show OTP Section** button
- This will manually show the OTP section to test if the UI works

### 2. **Check Console Logs**
When you click "Send OTP", watch for these logs:
```
🔍 Element Check:
Email Input: ✅
Send OTP Button: ✅
OTP Section: ✅
OTP Input: ✅
Verify Button: ✅

📤 Sending OTP to: your-email@example.com
📡 Response status: 200 or 500
📄 Response data: {...}
```

### 3. **Test Email Sending**
Check if the issue is:
- ❌ **Gmail Authentication** (535 error)
- ❌ **Server Response** (HTML instead of JSON)
- ❌ **UI Not Updating** (OTP section not showing)

## 🔧 **Possible Fixes:**

### Fix 1: Gmail App Password
```env
# In .env file, ensure correct password:
GMAIL_APP_PASSWORD=ewohifgantyhpkgd
```

### Fix 2: Manual OTP Testing
1. Click "🧪 Debug: Show OTP Section"
2. Enter any 6-digit number (like 123456)
3. Click "Verify" to test the verification flow

### Fix 3: Server Response Check
If you see HTML error instead of JSON:
1. Check server logs for authentication errors
2. Verify Gmail 2FA is enabled
3. Generate new app password

## 🎯 **Expected Flow:**
1. **Enter Email** → Click "Send OTP"
2. **Console Shows**: Element checks, API call, response
3. **UI Changes**: 
   - Email input gets disabled
   - OTP section appears
   - Send button becomes "Resend"
4. **Email Received** → Enter OTP → Verify → Success

## 🚨 **If Still Not Working:**
The debug button will help us isolate if it's:
- **UI Issue** (OTP section won't show)
- **API Issue** (Server not responding correctly)
- **Email Issue** (Gmail authentication failing)

Try the debug button first and let me know what happens!
